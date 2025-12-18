import type { APIRoute } from 'astro';
import { verifyAuth, getAuthenticatedSupabaseClient } from '../../../../lib/auth';
import { logImageUpload, logImageRemove } from '../../../../lib/logger';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

export const prerender = false;

// Helper para obter informações do request
function getRequestInfo(request: Request) {
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
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

// Função para calcular hash de um buffer
function hashBuffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex').substring(0, 16);
}

// Função auxiliar para processar UMA imagem
async function processOneImage(
  file: File,
  index: number,
  supabase: any,
  userEmail: string | undefined,
  ipAddress: string,
  userAgent: string
): Promise<{ url: string; fileName: string } | { error: string }> {
  const imageId = `img${index}_${Date.now()}_${uuidv4().substring(0, 8)}`;
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  [IMAGEM ${index + 1}] INÍCIO`);
  console.log(`  [IMAGEM ${index + 1}] Nome original: ${file.name}`);
  console.log(`  [IMAGEM ${index + 1}] Tamanho: ${file.size} bytes`);
  console.log(`  [IMAGEM ${index + 1}] Tipo: ${file.type}`);

  // FIX BUG 2.3: Adicionar HEIC e HEIF (formatos do iPhone)
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif',
  ];
  if (!allowedTypes.includes(file.type)) {
    return { error: `Tipo não permitido: ${file.type}` };
  }

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { error: `Arquivo muito grande: ${file.size}` };
  }

  // Ler dados do arquivo
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(new Uint8Array(arrayBuffer));

  const inputHash = hashBuffer(buffer);
  console.log(
    `  [IMAGEM ${index + 1}] Buffer: ${buffer.length} bytes, hash: ${inputHash}`
  );

  // Gerar nome ÚNICO para este arquivo
  const timestamp = Date.now();
  const uuid = uuidv4();
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const fileName = `${timestamp}-${uuid}-${randomSuffix}.webp`;
  const filePath = `produtos/${fileName}`;
  console.log(`  [IMAGEM ${index + 1}] Nome gerado: ${fileName}`);
  console.log(`  [IMAGEM ${index + 1}] Caminho destino: ${filePath}`);

  // Importar Sharp dinamicamente
  const sharp = (await import('sharp')).default;
  sharp.cache(false);
  sharp.concurrency(1);

  let optimizedBuffer: Buffer;
  try {
    const sharpInstance = sharp(buffer, {
      failOnError: false,
      sequentialRead: true,
    });

    optimizedBuffer = await sharpInstance
      .rotate() // Corrige orientação EXIF automaticamente (fotos de celular)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })
      .toBuffer();

    sharpInstance.destroy();
    console.log(
      `  [IMAGEM ${index + 1}] Sharp: ${buffer.length} -> ${
        optimizedBuffer.length
      } bytes`
    );
  } catch (e: any) {
    console.error(`  [IMAGEM ${index + 1}] Erro Sharp:`, e.message);
    optimizedBuffer = buffer;
  }

  // Upload para Supabase
  console.log(`  [IMAGEM ${index + 1}] Iniciando upload para Supabase...`);
  const { error: uploadError } = await supabase.storage
    .from('imagens')
    .upload(filePath, optimizedBuffer, {
      contentType: 'image/webp',
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error(`  [IMAGEM ${index + 1}] ❌ Erro Supabase:`, uploadError);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    // Retornar erro explícito, não retornar URL antiga!
    return { error: `Erro ao fazer upload da imagem: ${uploadError.message}` };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('imagens').getPublicUrl(filePath);

  const finalUrl = `${publicUrl}?v=${uuid}`;
  console.log(
    `  [IMAGEM ${index + 1}] ✅ Upload concluído! URL final: ${finalUrl}`
  );
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  await logImageUpload({
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    imageUrl: finalUrl,
    userEmail,
    status: 'success',
    ipAddress,
    userAgent,
  });

  return { url: finalUrl, fileName };
}

// POST - Upload de MÚLTIPLAS imagens em UMA requisição
export const POST: APIRoute = async ({ request, cookies }) => {
  const requestId = `batch_${Date.now()}_${uuidv4().substring(0, 8)}`;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📤 [BATCH UPLOAD ${requestId}] Nova requisição`);

  const { userAgent, ipAddress } = getRequestInfo(request);
  const userEmail = await getUserEmail(cookies);

  try {
    const authHeader = request.headers.get('Authorization');
    const isAuth = await verifyAuth(cookies, authHeader);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const contentType = request.headers.get('Content-Type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return new Response(JSON.stringify({ error: 'Content-Type inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const formData = await request.formData();

    // Coletar TODOS os arquivos do FormData
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file') && value instanceof File) {
        files.push(value);
      }
    }

    console.log(`[BATCH ${requestId}] ${files.length} arquivo(s) recebido(s)`);

    if (files.length === 0) {
      return new Response(JSON.stringify({ error: 'Nenhum arquivo enviado' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = getAuthenticatedSupabaseClient(cookies, authHeader);

    // Processar cada imagem SEQUENCIALMENTE
    const results: { url: string; fileName: string }[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await processOneImage(
        file,
        i,
        supabase,
        userEmail,
        ipAddress,
        userAgent
      );

      if ('error' in result) {
        errors.push(`Imagem ${i + 1}: ${result.error}`);
      } else {
        results.push(result);
      }
    }

    console.log(
      `\n[BATCH ${requestId}] Concluído: ${results.length} sucesso, ${errors.length} erros`
    );
    console.log(`${'='.repeat(60)}`);

    if (results.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Nenhuma imagem foi processada',
          details: errors,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Retornar ARRAY de URLs
    return new Response(
      JSON.stringify({
        urls: results.map((r) => r.url),
        fileNames: results.map((r) => r.fileName),
        count: results.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store',
        },
      }
    );
  } catch (error: any) {
    console.error(`❌ [BATCH ${requestId}] Erro:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE - Deletar imagem(ns)
export const DELETE: APIRoute = async ({ request, cookies }) => {
  const { userAgent, ipAddress } = getRequestInfo(request);
  const userEmail = await getUserEmail(cookies);

  try {
    const authHeader = request.headers.get('Authorization');
    const isAuth = await verifyAuth(cookies, authHeader);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const paths = body.paths || (body.path ? [body.path] : []);
    const skipLog = body.skipLog === true;

    if (!paths || paths.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Path(s) da imagem não informado(s)' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = getAuthenticatedSupabaseClient(cookies, authHeader);
    const { error } = await supabase.storage.from('imagens').remove(paths);

    if (error) {
      if (!skipLog) {
        for (const path of paths) {
          const fileName = path.split('/').pop() || path;
          await logImageRemove({
            fileName,
            imageUrl: path,
            userEmail,
            status: 'error',
            errorMessage: 'Erro ao remover imagem',
            ipAddress,
            userAgent,
          });
        }
      }
      throw error;
    }

    if (!skipLog) {
      for (const path of paths) {
        const fileName = path.split('/').pop() || path;
        await logImageRemove({
          fileName,
          imageUrl: path,
          userEmail,
          status: 'success',
          ipAddress,
          userAgent,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        deleted: paths.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
