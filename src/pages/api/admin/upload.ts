import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import crypto from 'node:crypto';

export const prerender = false;

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

export const POST: APIRoute = async ({ request, cookies }) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(
    `[API UPLOAD ${requestId}] ========================================`
  );
  console.log(`[API UPLOAD ${requestId}] Nova requisição recebida`);

  try {
    // 1. Verificar autenticação via cookie
    const authToken = cookies.get('sb-access-token')?.value;

    if (!authToken) {
      console.error(`[API UPLOAD ${requestId}] ❌ Sem token de autenticação`);
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

    // 2. Obter arquivo do FormData
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error: any) {
      console.error(
        `[API UPLOAD ${requestId}] ❌ Erro ao parsear FormData:`,
        error
      );
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
      console.error(
        `[API UPLOAD ${requestId}] ❌ Nenhum arquivo enviado no FormData`
      );
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

    console.log(`[API UPLOAD ${requestId}] ✅ Arquivo recebido:`, {
      name: file.name,
      size: (file.size / 1024).toFixed(2) + 'KB',
      type: file.type,
    });

    // 3. Validar tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.error(`[API UPLOAD ${requestId}] ❌ Tipo inválido:`, file.type);
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
      console.error(
        `[API UPLOAD ${requestId}] ❌ Arquivo muito grande:`,
        file.size
      );
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

    // 5. Converter para buffer
    let arrayBuffer: ArrayBuffer;
    let buffer: Uint8Array;
    try {
      arrayBuffer = await file.arrayBuffer();
      buffer = new Uint8Array(arrayBuffer);
    } catch (error: any) {
      console.error(
        `[API UPLOAD ${requestId}] ❌ Erro ao converter arquivo:`,
        error
      );
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

    // 6. ⭐ SOLUÇÃO DEFINITIVA: Gerar nome com MÁXIMA unicidade
    const now = Date.now();
    const uuid = crypto.randomUUID();
    const random1 = crypto.randomBytes(8).toString('hex');
    const random2 = Math.random().toString(36).substring(2, 15);
    const microtime = performance.now().toString().replace('.', '');

    // Hash do conteúdo do arquivo
    const hash = crypto
      .createHash('sha256')
      .update(buffer)
      .digest('hex')
      .substring(0, 12);

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';

    // ⭐ CRÍTICO: Nome impossível de colidir
    // Formato: produtos/UUID-TIMESTAMP-MICROTIME-HASH-RANDOM1-RANDOM2.ext
    const uniqueFileName = `${uuid}-${now}-${microtime}-${hash}-${random1}-${random2}.${fileExt}`;
    const filePath = `produtos/${uniqueFileName}`;

    console.log(`[API UPLOAD ${requestId}] ✅ Gerando nome único:`);
    console.log(
      `[API UPLOAD ${requestId}]    UUID: ${uuid.substring(0, 13)}...`
    );
    console.log(`[API UPLOAD ${requestId}]    Timestamp: ${now}`);
    console.log(
      `[API UPLOAD ${requestId}]    Microtime: ${microtime.substring(0, 15)}...`
    );
    console.log(`[API UPLOAD ${requestId}]    Hash: ${hash}`);
    console.log(
      `[API UPLOAD ${requestId}]    Random1: ${random1.substring(0, 10)}...`
    );
    console.log(`[API UPLOAD ${requestId}]    Random2: ${random2}`);
    console.log(
      `[API UPLOAD ${requestId}]    Path final: ${filePath.substring(0, 80)}...`
    );

    // 7. Upload usando SUPABASE ADMIN
    console.log(
      `[API UPLOAD ${requestId}] 📤 Iniciando upload para Supabase...`
    );

    let uploadData;
    let uploadError;

    try {
      const result = await supabaseAdmin.storage
        .from('imagens')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false, // NUNCA sobrescrever
          cacheControl: '3600',
        });

      uploadData = result.data;
      uploadError = result.error;
    } catch (error: any) {
      console.error(
        `[API UPLOAD ${requestId}] ❌ Exceção durante upload:`,
        error
      );
      return new Response(
        JSON.stringify({
          error: 'Erro ao fazer upload para storage',
          details: error.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (uploadError) {
      console.error(
        `[API UPLOAD ${requestId}] ❌ Erro no upload do Supabase:`,
        uploadError
      );
      return new Response(
        JSON.stringify({
          error: `Erro ao fazer upload: ${uploadError.message}`,
          details: uploadError,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[API UPLOAD ${requestId}] ✅ Upload bem-sucedido`);
    console.log(
      `[API UPLOAD ${requestId}]    Path retornado: ${uploadData?.path}`
    );

    // 8. ⭐ VERIFICAÇÃO: Confirmar que o arquivo foi salvo
    if (!uploadData || !uploadData.path) {
      console.error(`[API UPLOAD ${requestId}] ❌ Upload retornou sem path!`);
      return new Response(
        JSON.stringify({
          error: 'Upload falhou - sem path retornado',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 9. ⭐ SOLUÇÃO: Usar o path retornado pelo upload (não o que geramos)
    // Isso garante que estamos pegando a URL do arquivo que foi REALMENTE salvo
    const actualPath = uploadData.path;

    console.log(`[API UPLOAD ${requestId}] 🔍 Verificando paths:`);
    console.log(`[API UPLOAD ${requestId}]    Path enviado: ${filePath}`);
    console.log(`[API UPLOAD ${requestId}]    Path retornado: ${actualPath}`);

    // 10. Obter URL pública usando o path RETORNADO pelo upload
    const { data: urlData } = supabaseAdmin.storage
      .from('imagens')
      .getPublicUrl(actualPath);

    if (!urlData || !urlData.publicUrl) {
      console.error(`[API UPLOAD ${requestId}] ❌ URL pública não retornada`);
      return new Response(
        JSON.stringify({
          error: 'Erro ao obter URL pública',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 11. ⭐ Cache-busting usando TODOS os identificadores únicos
    const cacheBust = `t=${now}&u=${uuid.substring(
      0,
      8
    )}&h=${hash}&r1=${random1.substring(0, 8)}&r2=${random2}`;
    const finalUrl = `${urlData.publicUrl}?${cacheBust}`;

    const elapsed = Date.now() - startTime;

    console.log(
      `[API UPLOAD ${requestId}] ✅ Upload concluído em ${elapsed}ms`
    );
    console.log(`[API UPLOAD ${requestId}] 📍 URL base: ${urlData.publicUrl}`);
    console.log(
      `[API UPLOAD ${requestId}] 🔗 URL final: ${finalUrl.substring(0, 120)}...`
    );
    console.log(
      `[API UPLOAD ${requestId}] ========================================`
    );

    return new Response(
      JSON.stringify({
        success: true,
        url: finalUrl,
        path: actualPath,
        timestamp: now,
        elapsedMs: elapsed,
        debug: {
          requestId,
          pathSent: filePath.substring(0, 60),
          pathReturned: actualPath.substring(0, 60),
          urlBase: urlData.publicUrl.substring(0, 80),
        },
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
    console.error(`[API UPLOAD ${requestId}] ❌ ERRO FATAL:`, error);

    return new Response(
      JSON.stringify({
        error: 'Erro interno no servidor',
        message: error.message,
        stack: import.meta.env.DEV ? error.stack : undefined,
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

    const { error: deleteError } = await supabaseAdmin.storage
      .from('imagens')
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

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[API DELETE] ❌ ERRO FATAL:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
