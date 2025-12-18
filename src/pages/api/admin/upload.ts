import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
];

// Contador global para garantir unicidade
let uploadCounter = 0;

// Helper para gerar hash sem crypto (compatível com Astro/Vercel)
function simpleHash(buffer: Uint8Array): string {
  let hash = 0;
  const sampleSize = Math.min(buffer.length, 1024);
  for (let i = 0; i < sampleSize; i++) {
    hash = (hash << 5) - hash + buffer[i];
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).substring(0, 8);
}

// Helper para gerar timestamp de alta precisão
function getHighPrecisionTimestamp(): string {
  const now = Date.now();
  const random = Math.random().toString().substring(2, 10);
  return `${now}${random}`;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const startTime = Date.now();
  console.log('[API UPLOAD] ========================================');
  console.log('[API UPLOAD] Nova requisição recebida');

  try {
    // 1. Verificar autenticação via cookie
    const authToken = cookies.get('sb-access-token')?.value;

    if (!authToken) {
      console.error('[API UPLOAD] ❌ Sem token de autenticação');
      return new Response(
        JSON.stringify({
          error: 'Não autorizado - faça login novamente',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[API UPLOAD] ✅ Token de autenticação presente');

    // 2. Obter arquivo do FormData
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error: any) {
      console.error('[API UPLOAD] ❌ Erro ao parsear FormData:', error);
      return new Response(
        JSON.stringify({
          error: 'Erro ao processar formulário',
          details: error.message,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const file = formData.get('file') as File;

    if (!file) {
      console.error('[API UPLOAD] ❌ Nenhum arquivo enviado no FormData');
      return new Response(
        JSON.stringify({
          error: 'Nenhum arquivo foi enviado',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[API UPLOAD] ✅ Arquivo recebido:', {
      name: file.name,
      size: (file.size / 1024).toFixed(2) + 'KB',
      type: file.type,
    });

    // 3. Validar tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.error('[API UPLOAD] ❌ Tipo inválido:', file.type);
      return new Response(
        JSON.stringify({
          error: `Tipo de arquivo não permitido: ${file.type}`,
          allowedTypes: ALLOWED_TYPES,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 4. Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      console.error('[API UPLOAD] ❌ Arquivo muito grande:', file.size);
      return new Response(
        JSON.stringify({
          error: `Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(
            2
          )}MB (máx 10MB)`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 5. Gerar nome REALMENTE único
    uploadCounter++;
    const timestamp = Date.now();
    const highPrecision = getHighPrecisionTimestamp();
    const randomStr = Math.random().toString(36).substring(2, 15);

    console.log('[API UPLOAD] Gerando nome único...');
    console.log('[API UPLOAD]   - Counter:', uploadCounter);
    console.log('[API UPLOAD]   - Timestamp:', timestamp);
    console.log('[API UPLOAD]   - Random:', randomStr);

    // Converter para buffer
    let arrayBuffer: ArrayBuffer;
    let buffer: Uint8Array;
    try {
      arrayBuffer = await file.arrayBuffer();
      buffer = new Uint8Array(arrayBuffer);
      console.log(
        '[API UPLOAD] ✅ Arquivo convertido para buffer:',
        buffer.length,
        'bytes'
      );
    } catch (error: any) {
      console.error('[API UPLOAD] ❌ Erro ao converter arquivo:', error);
      return new Response(
        JSON.stringify({
          error: 'Erro ao processar arquivo',
          details: error.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Gerar hash do conteúdo
    const hashStr = simpleHash(buffer);
    console.log('[API UPLOAD]   - Hash:', hashStr);

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';

    // Nome final: timestamp-highprecision-random-counter-hash.ext
    const uniqueFileName = `${timestamp}-${highPrecision}-${randomStr}-${uploadCounter}-${hashStr}.${fileExt}`;

    console.log('[API UPLOAD] ✅ Nome único gerado:', uniqueFileName);

    // ✅ CORREÇÃO: Bucket = 'imagens', Path = 'produtos/filename.jpg'
    const filePath = `produtos/${uniqueFileName}`;

    console.log('[API UPLOAD] Iniciando upload para Supabase...');
    console.log('[API UPLOAD]   - Bucket: imagens'); // ← CORRETO!
    console.log('[API UPLOAD]   - Path: produtos/' + uniqueFileName); // ← CORRETO!
    console.log('[API UPLOAD]   - Size:', buffer.length, 'bytes');

    // 6. Upload usando SUPABASE ADMIN com bucket CORRETO
    let uploadData;
    let uploadError;
    try {
      const result = await supabaseAdmin.storage
        .from('imagens') // ← BUCKET CORRETO!
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
          cacheControl: '0',
        });

      uploadData = result.data;
      uploadError = result.error;
    } catch (error: any) {
      console.error('[API UPLOAD] ❌ Exceção durante upload:', error);
      return new Response(
        JSON.stringify({
          error: 'Erro ao fazer upload para storage',
          details: error.message,
          stack: error.stack,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (uploadError) {
      console.error('[API UPLOAD] ❌ Erro no upload do Supabase:', uploadError);
      return new Response(
        JSON.stringify({
          error: `Erro ao fazer upload: ${uploadError.message}`,
          details: uploadError,
          filePath: filePath,
          bucket: 'imagens',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[API UPLOAD] ✅ Upload bem-sucedido:', uploadData);

    // 7. Obter URL pública do bucket CORRETO
    let urlData;
    try {
      const result = supabaseAdmin.storage
        .from('imagens') // ← BUCKET CORRETO!
        .getPublicUrl(filePath);

      urlData = result.data;
    } catch (error: any) {
      console.error('[API UPLOAD] ❌ Erro ao obter URL pública:', error);
      return new Response(
        JSON.stringify({
          error: 'Erro ao obter URL pública',
          details: error.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!urlData || !urlData.publicUrl) {
      console.error('[API UPLOAD] ❌ URL pública não retornada');
      return new Response(
        JSON.stringify({
          error: 'Erro ao obter URL pública - URL vazia',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 8. Adicionar cache-busting
    const cacheBust = `t=${timestamp}&r=${randomStr}&h=${hashStr}&c=${uploadCounter}`;
    const finalUrl = `${urlData.publicUrl}?${cacheBust}`;

    const elapsed = Date.now() - startTime;
    console.log('[API UPLOAD] ✅ Upload concluído em', elapsed, 'ms');
    console.log('[API UPLOAD] URL:', finalUrl);
    console.log('[API UPLOAD] ========================================');

    // 9. Retornar sucesso
    return new Response(
      JSON.stringify({
        success: true,
        urls: [finalUrl],
        url: finalUrl,
        path: filePath,
        hash: hashStr,
        timestamp: timestamp,
        counter: uploadCounter,
        elapsedMs: elapsed,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: any) {
    console.error('[API UPLOAD] ❌ ERRO FATAL:', error);
    console.error('[API UPLOAD] Stack:', error.stack);

    return new Response(
      JSON.stringify({
        error: 'Erro interno no servidor',
        message: error.message,
        type: error.constructor.name,
        stack: error.stack?.split('\n').slice(0, 3).join('\n'),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  console.log('[API DELETE] ========================================');

  try {
    // Verificar autenticação
    const authToken = cookies.get('sb-access-token')?.value;

    if (!authToken) {
      console.error('[API DELETE] ❌ Sem autenticação');
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const path = url.searchParams.get('path');

    if (!path) {
      console.error('[API DELETE] ❌ Path não fornecido');
      return new Response(JSON.stringify({ error: 'Caminho não fornecido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('[API DELETE] Deletando:', path);
    console.log('[API DELETE]   - Bucket: imagens');

    // DELETE do bucket CORRETO
    const { error: deleteError } = await supabaseAdmin.storage
      .from('imagens') // ← BUCKET CORRETO!
      .remove([path]);

    if (deleteError) {
      console.error('[API DELETE] ❌ Erro ao deletar:', deleteError);
      return new Response(
        JSON.stringify({
          error: deleteError.message,
          details: deleteError,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[API DELETE] ✅ Arquivo deletado');
    console.log('[API DELETE] ========================================');

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[API DELETE] ❌ ERRO FATAL:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
