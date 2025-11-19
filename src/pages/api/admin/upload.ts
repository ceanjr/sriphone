import type { APIRoute } from 'astro';
import { verifyAuth, getAuthenticatedSupabaseClient } from '../../../lib/auth';
import { logImageUpload, logImageRemove } from '../../../lib/logger';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

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

export const POST: APIRoute = async ({ request, cookies }) => {
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

    // Validar Content-Type antes de tentar parsear formData
    const contentType = request.headers.get('Content-Type') || '';
    console.log('📋 Content-Type recebido:', contentType);

    if (!contentType.includes('multipart/form-data')) {
      await logImageUpload({
        fileName: 'unknown',
        fileSize: 0,
        mimeType: 'unknown',
        imageUrl: '',
        userEmail,
        status: 'error',
        errorMessage: 'Content-Type inválido para upload de arquivo',
        errorDetails: {
          receivedContentType: contentType,
          expectedContentType: 'multipart/form-data',
          headers: Object.fromEntries(request.headers.entries()),
        },
        ipAddress,
        userAgent,
      });

      return new Response(JSON.stringify({
        error: 'Content-Type deve ser multipart/form-data para upload de arquivos'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (formDataError: any) {
      console.error('Erro ao parsear formData:', formDataError);
      await logImageUpload({
        fileName: 'unknown',
        fileSize: 0,
        mimeType: 'unknown',
        imageUrl: '',
        userEmail,
        status: 'error',
        errorMessage: 'Erro ao processar dados do formulário',
        errorDetails: {
          error: formDataError.message,
          contentType: contentType,
          headers: Object.fromEntries(request.headers.entries()),
        },
        ipAddress,
        userAgent,
      });

      return new Response(JSON.stringify({
        error: 'Erro ao processar upload. Verifique se o arquivo foi enviado corretamente.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const file = formData.get('file') as File;

    if (!file) {
      // Log de erro: arquivo não enviado
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

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      // Log de erro: tipo de arquivo não permitido
      await logImageUpload({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        imageUrl: '',
        userEmail,
        status: 'error',
        errorMessage: 'Tipo de arquivo não permitido',
        errorDetails: { allowedTypes, receivedType: file.type },
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

    // Validar tamanho antes da otimização (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      // Log de erro: arquivo muito grande
      await logImageUpload({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        imageUrl: '',
        userEmail,
        status: 'error',
        errorMessage: 'Arquivo muito grande',
        errorDetails: { maxSize, receivedSize: file.size },
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

    // Converter File para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // IMPORTANTE: Criar hash do buffer para identificar arquivos únicos
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 16);
    console.log(`🔑 [UPLOAD] Hash do arquivo: ${hash} (${file.name})`);

    // Otimizar imagem com Sharp
    const originalSize = buffer.length;
    let optimizedBuffer: Buffer;

    try {
      console.log(`🖼️ [SHARP] Iniciando processamento do arquivo ${file.name} (hash: ${hash})`);

      // IMPORTANTE: Criar uma NOVA instância do Sharp para cada upload
      // para evitar reutilização de estado/cache entre processamentos paralelos
      const image = sharp(buffer, {
        failOnError: false,
        // Desabilitar cache para evitar problemas com uploads paralelos
        sequentialRead: true
      });

      const metadata = await image.metadata();
      console.log(`📐 [SHARP] Metadata (${hash}): ${metadata.width}x${metadata.height}, format: ${metadata.format}`);

      // IMPORTANTE: Sempre criar uma nova pipeline de transformação
      // sem reutilizar a instância anterior
      const shouldResize = metadata.width && metadata.width > 1200;
      console.log(`🔧 [SHARP] Redimensionar (${hash}): ${shouldResize ? 'SIM' : 'NÃO'}`);

      // Criar pipeline de transformação completa
      let pipeline = sharp(buffer, { sequentialRead: true });

      if (shouldResize) {
        pipeline = pipeline.resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Converter para WebP com qualidade 80
      optimizedBuffer = await pipeline
        .webp({
          quality: 80,
          effort: 4 // Balanço entre compressão e velocidade
        })
        .toBuffer();

      // Hash do buffer otimizado para confirmar que é único
      const optimizedHash = crypto.createHash('sha256').update(optimizedBuffer).digest('hex').substring(0, 16);
      console.log(`🔑 [SHARP] Hash do resultado (${hash}): ${optimizedHash}`);
      console.log(`📊 [SHARP] Otimização (${hash}): ${(originalSize / 1024).toFixed(1)}KB → ${(optimizedBuffer.length / 1024).toFixed(1)}KB (${((1 - optimizedBuffer.length / originalSize) * 100).toFixed(1)}% redução)`);
    } catch (sharpError: any) {
      console.error('Erro ao otimizar imagem:', sharpError);

      // Log de erro: falha ao processar imagem com Sharp
      await logImageUpload({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        imageUrl: '',
        userEmail,
        status: 'error',
        errorMessage: 'Erro ao processar imagem com Sharp',
        errorDetails: {
          error: sharpError.message,
          stack: sharpError.stack,
        },
        ipAddress,
        userAgent,
      });

      return new Response(JSON.stringify({
        error: 'Erro ao processar imagem'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Gerar nome único com extensão .webp usando UUID
    const timestamp = Date.now();
    const uuid = uuidv4(); // UUID v4 garante unicidade total
    const fileName = `${timestamp}-${uuid}.webp`;
    const filePath = `produtos/${fileName}`;

    // Upload para Supabase Storage com token autenticado
    const supabase = getAuthenticatedSupabaseClient(cookies, authHeader);
    const { error: uploadError } = await supabase.storage
      .from('imagens')
      .upload(filePath, optimizedBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600', // 1 hora (reduzido para evitar problemas de cache)
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);

      // Log de erro: falha no upload para Supabase Storage
      await logImageUpload({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        imageUrl: '',
        userEmail,
        status: 'error',
        errorMessage: 'Erro ao fazer upload para Supabase Storage',
        errorDetails: {
          error: uploadError.message,
          filePath,
        },
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

    // Obter URL pública com cache-busting
    const { data: { publicUrl } } = supabase.storage
      .from('imagens')
      .getPublicUrl(filePath);

    // IMPORTANTE: Usar UUID único para cache-busting ao invés de timestamp
    // Quando múltiplas imagens são enviadas em paralelo, timestamp pode ser o mesmo,
    // causando cache incorreto no navegador
    const cacheBustingId = uuidv4();
    const cacheBustingUrl = `${publicUrl}?v=${cacheBustingId}`;

    console.log('📸 Imagem enviada:', {
      fileName,
      path: filePath,
      url: cacheBustingUrl
    });

    // Log de sucesso: upload realizado com sucesso
    await logImageUpload({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      imageUrl: cacheBustingUrl,
      userEmail,
      status: 'success',
      ipAddress,
      userAgent,
    });

    return new Response(JSON.stringify({
      url: cacheBustingUrl,
      path: filePath,
      fileName: fileName,
      optimized: true,
      originalSize: originalSize,
      optimizedSize: optimizedBuffer.length,
      savings: ((1 - optimizedBuffer.length / originalSize) * 100).toFixed(1) + '%'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Upload error:', error);

    // Log de erro: exceção não tratada
    await logImageUpload({
      fileName: 'unknown',
      fileSize: 0,
      mimeType: 'unknown',
      imageUrl: '',
      userEmail,
      status: 'error',
      errorMessage: 'Exceção não tratada no upload',
      errorDetails: {
        error: error.message,
        stack: error.stack,
      },
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
export const DELETE: APIRoute = async ({ request, cookies, url }) => {
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

    // Suporta tanto path único quanto array de paths
    const paths = body.paths || (body.path ? [body.path] : []);

    // Verificar se deve pular logs (para limpeza de imagens temporárias)
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
      // Log de erro: falha ao remover imagem (apenas se não skipLog)
      if (!skipLog) {
        for (const path of paths) {
          const fileName = path.split('/').pop() || path;
          await logImageRemove({
            fileName,
            imageUrl: path,
            userEmail,
            status: 'error',
            errorMessage: 'Erro ao remover imagem do Storage',
            ipAddress,
            userAgent,
          });
        }
      }

      throw error;
    }

    // Log de sucesso: imagens removidas (apenas se não skipLog)
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
    } else {
      console.log(`🧹 ${paths.length} imagem(ns) temporária(s) removida(s) (sem log)`);
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
