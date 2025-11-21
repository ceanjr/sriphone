import type { APIRoute } from 'astro';
import { verifyAuth, getAuthenticatedSupabaseClient } from '../../../lib/auth';
import { logImageUpload, logImageRemove } from '../../../lib/logger';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';

export const prerender = false;

// Headers para NUNCA cachear esta API
const NO_CACHE_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store',
  'X-Request-Id': '', // Será preenchido em cada requisição
};

// CRÍTICO: Desabilitar TODOS os caches do Sharp para evitar problemas em serverless
// Isso é necessário porque funções serverless podem reutilizar instâncias
sharp.cache(false);
sharp.concurrency(1); // Processar uma imagem por vez

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
  // CRÍTICO: Gerar ID único para esta requisição IMEDIATAMENTE
  const requestId = `req_${Date.now()}_${uuidv4()}`;
  console.log(`\n\n${'='.repeat(60)}`);
  console.log(`🆕 [REQUEST ${requestId}] Nova requisição de upload iniciada`);
  console.log(`${'='.repeat(60)}`);

  const { userAgent, ipAddress } = getRequestInfo(request);
  const userEmail = await getUserEmail(cookies);

  // Headers de resposta com ID único
  const responseHeaders = {
    ...NO_CACHE_HEADERS,
    'X-Request-Id': requestId,
  };

  try {
    const authHeader = request.headers.get('Authorization');
    const isAuth = await verifyAuth(cookies, authHeader);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Não autenticado', requestId }), {
        status: 401,
        headers: responseHeaders,
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
        error: 'Content-Type deve ser multipart/form-data para upload de arquivos',
        requestId
      }), {
        status: 400,
        headers: responseHeaders,
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
        error: 'Erro ao processar upload. Verifique se o arquivo foi enviado corretamente.',
        requestId
      }), {
        status: 400,
        headers: responseHeaders,
      });
    }

    const file = formData.get('file') as File;

    // CRÍTICO: Extrair campos únicos enviados pelo frontend para debug
    const frontendRequestId = formData.get('_requestId') as string;
    const frontendTimestamp = formData.get('_timestamp') as string;
    const frontendFileHash = formData.get('_fileHash') as string;

    // DEBUG: Log detalhado do arquivo recebido
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📥 [RECEBIDO] RequestId do servidor: ${requestId}`);
    console.log(`📥 [RECEBIDO] RequestId do frontend: ${frontendRequestId || 'N/A'}`);
    console.log(`📥 [RECEBIDO] Timestamp do frontend: ${frontendTimestamp || 'N/A'}`);
    console.log(`📥 [RECEBIDO] Hash do frontend: ${frontendFileHash || 'N/A'}`);
    console.log(`📥 [RECEBIDO] Arquivo: ${file?.name || 'N/A'}`);
    console.log(`📥 [RECEBIDO] Tamanho: ${file?.size || 0} bytes`);
    console.log(`📥 [RECEBIDO] Tipo: ${file?.type || 'N/A'}`);
    console.log(`📥 [RECEBIDO] lastModified: ${file?.lastModified || 'N/A'}`);

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

      return new Response(JSON.stringify({ error: 'Nenhum arquivo enviado', requestId }), {
        status: 400,
        headers: responseHeaders,
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
        error: 'Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.',
        requestId
      }), {
        status: 400,
        headers: responseHeaders,
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
        error: 'Arquivo muito grande. Tamanho máximo: 10MB',
        requestId
      }), {
        status: 400,
        headers: responseHeaders,
      });
    }

    // CRÍTICO: Converter File para Buffer com CÓPIA REAL dos dados
    // O file.arrayBuffer() pode retornar um buffer compartilhado em serverless
    // Precisamos garantir que temos uma cópia isolada dos dados
    const arrayBuffer = await file.arrayBuffer();

    // Criar uma cópia REAL do ArrayBuffer usando Uint8Array + slice
    // Isso força uma cópia dos dados em vez de criar uma view
    const uint8Array = new Uint8Array(arrayBuffer);
    const copiedArray = uint8Array.slice(); // slice() sem argumentos cria uma cópia
    const buffer = Buffer.from(copiedArray.buffer);

    console.log(`📥 [BUFFER] ArrayBuffer original byteLength: ${arrayBuffer.byteLength}`);
    console.log(`📥 [BUFFER] Uint8Array length: ${uint8Array.length}`);
    console.log(`📥 [BUFFER] Copied array length: ${copiedArray.length}`);
    console.log(`📥 [BUFFER] Buffer final length: ${buffer.length}`);

    // Criar hash do buffer original para identificar arquivos únicos
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 16);
    console.log(`🔑 [UPLOAD] Hash do arquivo original: ${hash} (${file.name})`);

    // Gerar nome ÚNICO antes de qualquer processamento
    const timestamp = Date.now();
    const uuid = uuidv4();
    const randomSuffix = randomBytes(8).toString('hex');

    // Determinar extensão baseada no tipo original ou usar webp
    const originalExt = file.type.split('/')[1] || 'webp';
    const useWebp = true; // Converter para WebP para otimização
    const fileExt = useWebp ? 'webp' : originalExt;
    const fileName = `${timestamp}-${uuid}-${randomSuffix}.${fileExt}`;
    const filePath = `produtos/${fileName}`;

    console.log(`📁 [UPLOAD] Nome do arquivo gerado: ${fileName}`);

    // Processar imagem com Sharp (cada operação cria instância nova)
    const originalSize = buffer.length;
    let finalBuffer: Buffer;
    let imageContentType: string;

    try {
      console.log(`🖼️ [SHARP] Processando: ${file.name} -> ${fileName}`);
      console.log(`🔍 [SHARP] Buffer original: ${buffer.length} bytes, hash: ${hash}`);

      // CRÍTICO: Criar uma cópia COMPLETAMENTE INDEPENDENTE do buffer para o Sharp
      // Usar Uint8Array + slice() para garantir cópia real dos dados
      const uint8ForSharp = new Uint8Array(buffer);
      const sharpArrayCopy = uint8ForSharp.slice();
      const bufferCopy = Buffer.from(sharpArrayCopy);

      // Verificar que a cópia é realmente diferente
      const copyHash = crypto.createHash('sha256').update(bufferCopy).digest('hex').substring(0, 16);
      console.log(`📋 [SHARP] Buffer copiado para Sharp: ${bufferCopy.length} bytes, hash: ${copyHash}`);

      // CRÍTICO: Forçar reset do cache do Sharp antes de cada processamento
      sharp.cache(false);

      // Criar instância do Sharp com o buffer isolado
      const sharpInstance = sharp(bufferCopy, {
        failOnError: false,
        sequentialRead: true,
        unlimited: true,  // Permitir imagens grandes
        limitInputPixels: false  // Sem limite de pixels
      });

      // Processar a imagem
      finalBuffer = await sharpInstance
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({
          quality: 80,
          effort: 4
        })
        .toBuffer();

      // Destruir a instância explicitamente para liberar recursos
      sharpInstance.destroy();

      imageContentType = 'image/webp';

      // Hash do resultado para verificar unicidade
      const resultHash = crypto.createHash('sha256').update(finalBuffer).digest('hex').substring(0, 16);
      console.log(`✅ [SHARP] Resultado: ${hash} -> ${resultHash} (${(originalSize/1024).toFixed(1)}KB -> ${(finalBuffer.length/1024).toFixed(1)}KB)`);

      // Verificar se o resultado é diferente do input (sanity check)
      if (resultHash === hash) {
        console.warn(`⚠️ [SHARP] Hash de entrada e saída são iguais - possível problema de processamento`);
      }

    } catch (sharpError: any) {
      console.error('❌ [SHARP] Erro:', sharpError.message);

      // Fallback: usar imagem original sem processamento
      console.log(`⚠️ [UPLOAD] Usando imagem original sem processamento`);
      finalBuffer = buffer;
      imageContentType = file.type;
    }

    // Upload para Supabase Storage com token autenticado
    console.log(`☁️ [SUPABASE] Iniciando upload para: ${filePath}`);
    console.log(`☁️ [SUPABASE] Tamanho do buffer final: ${finalBuffer.length} bytes`);

    // DEBUG: Hash do buffer que será enviado ao Supabase
    const uploadHash = crypto.createHash('sha256').update(finalBuffer).digest('hex').substring(0, 16);
    console.log(`☁️ [SUPABASE] Hash do buffer para upload: ${uploadHash}`);

    const supabase = getAuthenticatedSupabaseClient(cookies, authHeader);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('imagens')
      .upload(filePath, finalBuffer, {
        contentType: imageContentType,
        cacheControl: '3600',
        upsert: false
      });

    console.log(`☁️ [SUPABASE] Resultado do upload:`, uploadData);

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
        error: 'Erro ao fazer upload da imagem',
        requestId
      }), {
        status: 500,
        headers: responseHeaders,
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

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📸 [RESULTADO] Upload completo!');
    console.log(`📸 [RESULTADO] Arquivo original: ${file.name}`);
    console.log(`📸 [RESULTADO] Nome no storage: ${fileName}`);
    console.log(`📸 [RESULTADO] Path: ${filePath}`);
    console.log(`📸 [RESULTADO] URL pública: ${publicUrl}`);
    console.log(`📸 [RESULTADO] URL com cache-busting: ${cacheBustingUrl}`);
    console.log(`📸 [RESULTADO] Hash original: ${hash}`);
    console.log(`📸 [RESULTADO] Hash enviado: ${uploadHash}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

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

    console.log(`✅ [REQUEST ${requestId}] Upload completo com sucesso!`);

    return new Response(JSON.stringify({
      url: cacheBustingUrl,
      path: filePath,
      fileName: fileName,
      optimized: true,
      originalSize: originalSize,
      optimizedSize: finalBuffer.length,
      savings: ((1 - finalBuffer.length / originalSize) * 100).toFixed(1) + '%',
      requestId, // ID gerado pelo servidor
      frontendRequestId: frontendRequestId || null, // ID enviado pelo frontend
      frontendFileHash: frontendFileHash || null, // Hash enviado pelo frontend
      serverFileHash: hash, // Hash calculado pelo servidor
    }), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error(`❌ [REQUEST ${requestId}] Upload error:`, error);

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
        requestId,
      },
      ipAddress,
      userAgent,
    });

    return new Response(JSON.stringify({ error: error.message, requestId }), {
      status: 500,
      headers: responseHeaders,
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
