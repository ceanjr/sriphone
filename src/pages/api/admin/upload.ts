import type { APIRoute } from 'astro';
import { verifyAuth, getAuthenticatedSupabaseClient } from '../../../lib/auth';
import { logImageUpload, logImageRemove } from '../../../lib/logger';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

export const prerender = false;

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

// Função para calcular hash de um buffer
function hashBuffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex').substring(0, 16);
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const requestId = `${Date.now()}_${uuidv4().substring(0, 8)}`;
  console.log(`\n${'='.repeat(50)}`);
  console.log(`📤 [UPLOAD ${requestId}] Nova requisição`);

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

    // Validar Content-Type
    const contentType = request.headers.get('Content-Type') || '';
    if (!contentType.includes('multipart/form-data')) {
      console.error(`[UPLOAD ${requestId}] Content-Type inválido: ${contentType}`);
      return new Response(JSON.stringify({
        error: 'Content-Type deve ser multipart/form-data'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parsear FormData
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (formDataError: any) {
      console.error(`[UPLOAD ${requestId}] Erro ao parsear formData:`, formDataError);
      return new Response(JSON.stringify({
        error: 'Erro ao processar upload'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const file = formData.get('file') as File;

    if (!file) {
      console.error(`[UPLOAD ${requestId}] Nenhum arquivo enviado`);
      await logImageUpload({
        fileName: 'unknown',
        fileSize: 0,
        mimeType: 'unknown',
        imageUrl: '',
        userEmail,
        status: 'error',
        errorMessage: 'Nenhum arquivo enviado',
        ipAddress,
        userAgent,
      });

      return new Response(JSON.stringify({ error: 'Nenhum arquivo enviado' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`[UPLOAD ${requestId}] Arquivo: ${file.name}, ${file.size} bytes, ${file.type}`);

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      console.error(`[UPLOAD ${requestId}] Tipo não permitido: ${file.type}`);
      await logImageUpload({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        imageUrl: '',
        userEmail,
        status: 'error',
        errorMessage: 'Tipo de arquivo não permitido',
        ipAddress,
        userAgent,
      });

      return new Response(JSON.stringify({
        error: 'Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error(`[UPLOAD ${requestId}] Arquivo muito grande: ${file.size}`);
      await logImageUpload({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        imageUrl: '',
        userEmail,
        status: 'error',
        errorMessage: 'Arquivo muito grande',
        ipAddress,
        userAgent,
      });

      return new Response(JSON.stringify({
        error: 'Arquivo muito grande. Tamanho máximo: 10MB'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // CRÍTICO: Converter File para Buffer com CÓPIA ISOLADA
    // Usar Uint8Array.slice() para garantir cópia real dos dados
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const copiedArray = uint8Array.slice(); // Cria cópia independente
    const buffer = Buffer.from(copiedArray);

    const inputHash = hashBuffer(buffer);
    console.log(`[UPLOAD ${requestId}] Buffer: ${buffer.length} bytes, hash: ${inputHash}`);

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const uuid = uuidv4();
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const fileName = `${timestamp}-${uuid}-${randomSuffix}.webp`;
    const filePath = `produtos/${fileName}`;

    console.log(`[UPLOAD ${requestId}] Destino: ${filePath}`);

    // CRÍTICO: Importar Sharp DINAMICAMENTE para cada requisição
    // Isso evita qualquer estado compartilhado entre invocações
    const sharp = (await import('sharp')).default;

    // Desabilitar cache do Sharp
    sharp.cache(false);
    sharp.concurrency(1);

    // Otimizar imagem com Sharp
    const originalSize = buffer.length;
    let optimizedBuffer: Buffer;

    try {
      console.log(`[UPLOAD ${requestId}] Processando com Sharp...`);

      // Criar cópia do buffer específica para o Sharp
      const sharpInputCopy = Buffer.from(uint8Array.slice());

      const sharpInputHash = hashBuffer(sharpInputCopy);
      console.log(`[UPLOAD ${requestId}] Sharp input hash: ${sharpInputHash}`);

      // Criar instância nova do Sharp com buffer isolado
      const sharpInstance = sharp(sharpInputCopy, {
        failOnError: false,
        sequentialRead: true,
        unlimited: true,
      });

      optimizedBuffer = await sharpInstance
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({
          quality: 80,
          effort: 4
        })
        .toBuffer();

      // Destruir instância para liberar recursos
      sharpInstance.destroy();

      const outputHash = hashBuffer(optimizedBuffer);
      console.log(`[UPLOAD ${requestId}] Sharp output: ${originalSize} -> ${optimizedBuffer.length} bytes`);
      console.log(`[UPLOAD ${requestId}] Output hash: ${outputHash}`);

    } catch (sharpError: any) {
      console.error(`[UPLOAD ${requestId}] Erro Sharp:`, sharpError.message);
      // Fallback: usar imagem original
      optimizedBuffer = buffer;
    }

    // Upload para Supabase Storage
    console.log(`[UPLOAD ${requestId}] Enviando para Supabase...`);

    const supabase = getAuthenticatedSupabaseClient(cookies, authHeader);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('imagens')
      .upload(filePath, optimizedBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error(`[UPLOAD ${requestId}] Erro Supabase:`, uploadError);
      await logImageUpload({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        imageUrl: '',
        userEmail,
        status: 'error',
        errorMessage: 'Erro ao fazer upload para Storage',
        errorDetails: { error: uploadError.message },
        ipAddress,
        userAgent,
      });

      return new Response(JSON.stringify({
        error: 'Erro ao fazer upload da imagem'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('imagens')
      .getPublicUrl(filePath);

    // Adicionar cache-buster
    const finalUrl = `${publicUrl}?v=${uuid}`;

    console.log(`✅ [UPLOAD ${requestId}] Sucesso!`);
    console.log(`   URL: ${finalUrl}`);
    console.log(`   Input hash: ${inputHash}`);
    console.log(`   Output hash: ${hashBuffer(optimizedBuffer)}`);
    console.log(`${'='.repeat(50)}`);

    // Log de sucesso
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

    return new Response(JSON.stringify({
      url: finalUrl,
      path: filePath,
      fileName: fileName,
      optimized: true,
      originalSize: originalSize,
      optimizedSize: optimizedBuffer.length,
      savings: ((1 - optimizedBuffer.length / originalSize) * 100).toFixed(1) + '%',
      inputHash: inputHash,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error(`❌ [UPLOAD ${requestId}] Erro:`, error);

    await logImageUpload({
      fileName: 'unknown',
      fileSize: 0,
      mimeType: 'unknown',
      imageUrl: '',
      userEmail,
      status: 'error',
      errorMessage: 'Exceção não tratada',
      errorDetails: { error: error.message },
      ipAddress,
      userAgent,
    });

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
      return new Response(JSON.stringify({ error: 'Path(s) da imagem não informado(s)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = getAuthenticatedSupabaseClient(cookies, authHeader);
    const { error } = await supabase.storage
      .from('imagens')
      .remove(paths);

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

    return new Response(JSON.stringify({
      success: true,
      deleted: paths.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
