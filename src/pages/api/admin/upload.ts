import type { APIRoute } from 'astro';
import { verifyAuth, getAuthenticatedSupabaseClient } from '../../../lib/auth';
import { logImageUpload, logImageRemove } from '../../../lib/logger';
import { v4 as uuidv4 } from 'uuid';

export const prerender = false;

// Configurações de variantes (baseado no UPLOAD.md do usuário)
const IMAGE_VARIANTS = {
  thumb: { width: 150, height: 150, quality: 70 },
  small: { width: 400, height: 400, quality: 80 },
  medium: { width: 800, height: 800, quality: 80 },
  large: { width: 1200, height: 1200, quality: 85 },
  original: { width: 1920, height: 1920, quality: 85 },
} as const;

type VariantKey = keyof typeof IMAGE_VARIANTS;

// Helper para obter informações do request
function getRequestInfo(request: Request) {
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                    request.headers.get('x-real-ip') ||
                    'unknown';
  return { userAgent, ipAddress };
}

// Helper para obter email do usuário autenticado
async function getUserEmail(cookies: any) {
  try {
    const sessionCookie = cookies.get('sb-access-token')?.value;
    if (!sessionCookie) return undefined;
    const payload = JSON.parse(atob(sessionCookie.split('.')[1]));
    return payload.email;
  } catch {
    return undefined;
  }
}

/**
 * Processa e faz upload de uma imagem gerando todas as variantes
 */
async function processAndUploadVariants(
  file: File,
  supabase: any,
  userEmail: string | undefined,
  ipAddress: string,
  userAgent: string
): Promise<{ url: string; path: string } | { error: string }> {
  
  // 1. Validações Básicas
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
  if (!allowedTypes.includes(file.type)) {
    return { error: `Tipo não permitido: ${file.type}` };
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { error: `Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(2)}MB` };
  }

  try {
    // 2. Preparar Buffer
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(new Uint8Array(arrayBuffer));

    // 3. Gerar Nome Base Único (Timestamp + UUID)
    const baseId = `${Date.now()}-${uuidv4().substring(0, 8)}`;
    
    // 4. Importar Sharp
    const sharp = (await import('sharp')).default;
    sharp.cache(false); // Importante para não reutilizar memória de buffers antigos

    // 5. Gerar e Fazer Upload das Variantes
    const uploadPromises = Object.entries(IMAGE_VARIANTS).map(async ([key, config]) => {
      const variantKey = key as VariantKey;
      const fileName = `${baseId}-${variantKey}.webp`;
      const filePath = `produtos/${fileName}`;

      // Otimização com Sharp
      const optimizedBuffer = await sharp(inputBuffer, { failOnError: false })
        .rotate() // Respeitar orientação EXIF
        .resize(config.width, config.height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: config.quality, effort: 4 })
        .toBuffer();

      // Upload para o bucket 'imagens'
      const { error: uploadError } = await supabase.storage
        .from('imagens')
        .upload(filePath, optimizedBuffer, {
          contentType: 'image/webp',
          cacheControl: '31536000', // 1 ano (imutável)
          upsert: false
        });

      if (uploadError) throw uploadError;

      return { key: variantKey, path: filePath };
    });

    const results = await Promise.all(uploadPromises);
    
    // 6. Obter URL da variante 'original' para retornar ao cliente
    const original = results.find(r => r.key === 'original');
    if (!original) throw new Error('Falha ao processar variante original');

    const { data: { publicUrl } } = supabase.storage
      .from('imagens')
      .getPublicUrl(original.path);

    // Logging
    await logImageUpload({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      imageUrl: publicUrl,
      userEmail,
      status: 'success',
      ipAddress,
      userAgent,
    });

    return { url: publicUrl, path: original.path };

  } catch (err: any) {
    console.error('[Upload API] Erro no processamento:', err.message);
    return { error: err.message || 'Erro ao processar imagem' };
  }
}

// POST - Endpoint de Upload
export const POST: APIRoute = async ({ request, cookies }) => {
  const { userAgent, ipAddress } = getRequestInfo(request);
  const userEmail = await getUserEmail(cookies);

  try {
    // 1. Auth check
    const authHeader = request.headers.get('Authorization');
    const isAuth = await verifyAuth(cookies, authHeader);
    if (!isAuth) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 });

    // 2. FormData check
    const formData = await request.formData();
    const files: File[] = [];
    
    // Coleta arquivos (suporta 'file', 'file0', 'file1', etc)
    for (const [key, value] of formData.entries()) {
      if ((key === 'file' || key.startsWith('file')) && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) return new Response(JSON.stringify({ error: 'Nenhuma imagem enviada' }), { status: 400 });

    const supabase = getAuthenticatedSupabaseClient(cookies, authHeader);
    const results = [];
    const errors = [];

    // 3. Processar imagens sequencialmente para segurança e ordem
    for (const file of files) {
      const res = await processAndUploadVariants(file, supabase, userEmail, ipAddress, userAgent);
      if ('error' in res) {
        errors.push(`${file.name}: ${res.error}`);
      } else {
        results.push(res);
      }
    }

    if (results.length === 0) {
      return new Response(JSON.stringify({ error: 'Falha ao processar imagens', details: errors }), { status: 500 });
    }

    // 4. Retorno com Headers Anti-Cache
    return new Response(JSON.stringify({
      urls: results.map(r => r.url),
      paths: results.map(r => r.path),
      errors: errors.length > 0 ? errors : undefined
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error: any) {
    console.error('[Upload API Critical]:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

// DELETE - Endpoint de Remoção (Opcional, mas bom ter suporte a variantes)
export const DELETE: APIRoute = async ({ request, cookies }) => {
  const { userAgent, ipAddress } = getRequestInfo(request);
  const userEmail = await getUserEmail(cookies);

  try {
    const authHeader = request.headers.get('Authorization');
    if (!await verifyAuth(cookies, authHeader)) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 });

    const { paths } = await request.json();
    if (!paths || !Array.isArray(paths)) return new Response(JSON.stringify({ error: 'Caminhos inválidos' }), { status: 400 });

    const supabase = getAuthenticatedSupabaseClient(cookies, authHeader);
    
    // Tenta encontrar todas as variantes para cada path fornecido
    const allPathsToDelete: string[] = [];
    
    for (const path of paths) {
      // Se o path segue o padrão baseId-variant.webp
      const baseMatch = path.match(/(.*)-(?:thumb|small|medium|large|original)\.webp$/);
      if (baseMatch) {
        const basePath = baseMatch[1];
        // Adiciona todas as variantes possíveis para deleção
        ['thumb', 'small', 'medium', 'large', 'original'].forEach(v => {
          allPathsToDelete.push(`${basePath}-${v}.webp`);
        });
      } else {
        allPathsToDelete.push(path);
      }
    }

    const { error } = await supabase.storage.from('imagens').remove(allPathsToDelete);
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, deleted: allPathsToDelete.length }), { status: 200 });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};