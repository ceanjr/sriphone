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

// Cache para rastrear uploads recentes e evitar duplicatas
const recentUploads = new Map<string, { url: string; timestamp: number }>();

// Limpar cache antigo a cada minuto
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of recentUploads.entries()) {
    if (now - value.timestamp > 60000) {
      // 1 minuto
      recentUploads.delete(key);
    }
  }
}, 60000);

export const POST: APIRoute = async ({ request, cookies }) => {
  const requestId = crypto.randomUUID().substring(0, 8);
  const requestTimestamp = Date.now();

  console.log(`\n${'='.repeat(80)}`);
  console.log(`[API UPLOAD ${requestId}] NOVA REQUISIÇÃO`);
  console.log(`[API UPLOAD ${requestId}] Timestamp: ${requestTimestamp}`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    // 1. Verificar autenticação
    const authToken = cookies.get('sb-access-token')?.value;

    if (!authToken) {
      console.error(`[API UPLOAD ${requestId}] ❌ Sem autenticação`);
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Obter arquivo
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error(`[API UPLOAD ${requestId}] ❌ Nenhum arquivo`);
      return new Response(JSON.stringify({ error: 'Nenhum arquivo' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`[API UPLOAD ${requestId}] 📁 Arquivo recebido:`);
    console.log(`[API UPLOAD ${requestId}]    Nome: ${file.name}`);
    console.log(`[API UPLOAD ${requestId}]    Tipo: ${file.type}`);
    console.log(
      `[API UPLOAD ${requestId}]    Tamanho: ${(file.size / 1024).toFixed(2)}KB`
    );

    // 3. Validações
    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: `Tipo não permitido: ${file.type}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Arquivo muito grande (máx 10MB)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Converter para buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // 5. 🔥 Gerar hash do conteúdo para detectar arquivos idênticos
    const contentHash = crypto
      .createHash('md5')
      .update(buffer)
      .digest('hex')
      .substring(0, 12);

    console.log(
      `[API UPLOAD ${requestId}] 🔐 Hash do conteúdo: ${contentHash}`
    );

    // 6. 🔥 Verificar se já fizemos upload deste arquivo recentemente
    const cacheKey = `${contentHash}-${file.size}`;
    const cached = recentUploads.get(cacheKey);

    if (cached && requestTimestamp - cached.timestamp < 10000) {
      console.warn(`[API UPLOAD ${requestId}] ⚠️ ARQUIVO DUPLICADO detectado!`);
      console.warn(`[API UPLOAD ${requestId}]    Cache key: ${cacheKey}`);
      console.warn(
        `[API UPLOAD ${requestId}]    Tempo desde último: ${
          requestTimestamp - cached.timestamp
        }ms`
      );
      console.warn(
        `[API UPLOAD ${requestId}]    Retornando URL em cache: ${cached.url}`
      );

      return new Response(
        JSON.stringify({
          success: true,
          url: cached.url,
          cached: true,
          message: 'Arquivo idêntico já foi enviado recentemente',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 7. 🔥 Gerar nome ÚNICO com múltiplas camadas
    const now = Date.now();
    const nanotime = performance
      .now()
      .toString()
      .replace('.', '')
      .substring(0, 10);
    const random1 = Math.random().toString(36).substring(2, 10);
    const random2 = crypto.randomBytes(4).toString('hex');
    const fileExt = file.type.split('/')[1] || 'jpg';

    // Formato: timestamp-nanotime-random1-random2-hash.ext
    const fileName = `${now}-${nanotime}-${random1}-${random2}-${contentHash}.${fileExt}`;
    const filePath = `produtos/${fileName}`;

    console.log(`[API UPLOAD ${requestId}] 🎯 Nome gerado:`);
    console.log(`[API UPLOAD ${requestId}]    Nome: ${fileName}`);
    console.log(`[API UPLOAD ${requestId}]    Path: ${filePath}`);
    console.log(`[API UPLOAD ${requestId}]    Componentes:`);
    console.log(`[API UPLOAD ${requestId}]      - Timestamp: ${now}`);
    console.log(`[API UPLOAD ${requestId}]      - Nanotime: ${nanotime}`);
    console.log(`[API UPLOAD ${requestId}]      - Random1: ${random1}`);
    console.log(`[API UPLOAD ${requestId}]      - Random2: ${random2}`);
    console.log(`[API UPLOAD ${requestId}]      - Hash: ${contentHash}`);

    // 8. Upload para Supabase
    console.log(
      `[API UPLOAD ${requestId}] 📤 Iniciando upload para Supabase...`
    );

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('imagens')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error(
        `[API UPLOAD ${requestId}] ❌ Erro no upload:`,
        uploadError
      );
      return new Response(
        JSON.stringify({ error: `Erro no upload: ${uploadError.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[API UPLOAD ${requestId}] ✅ Upload bem-sucedido`);
    console.log(
      `[API UPLOAD ${requestId}]    Path retornado: ${uploadData?.path}`
    );

    // 9. Verificar path retornado
    if (!uploadData || !uploadData.path) {
      console.error(`[API UPLOAD ${requestId}] ❌ Upload sem path!`);
      return new Response(
        JSON.stringify({ error: 'Upload falhou - sem path' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 10. Verificar se path retornado é diferente do enviado
    if (uploadData.path !== filePath) {
      console.warn(`[API UPLOAD ${requestId}] ⚠️ Path diferente!`);
      console.warn(`[API UPLOAD ${requestId}]    Enviado: ${filePath}`);
      console.warn(
        `[API UPLOAD ${requestId}]    Retornado: ${uploadData.path}`
      );
    }

    // 11. Obter URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from('imagens')
      .getPublicUrl(uploadData.path);

    if (!urlData || !urlData.publicUrl) {
      console.error(`[API UPLOAD ${requestId}] ❌ URL pública não retornada`);
      return new Response(JSON.stringify({ error: 'Erro ao obter URL' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const baseUrl = urlData.publicUrl;

    // 12. 🔥 Adicionar cache-busting ÚNICO na query string
    const cacheBust = `t=${now}&r=${random1}&n=${nanotime}`;
    const finalUrl = `${baseUrl}?${cacheBust}`;

    // 13. Salvar no cache
    recentUploads.set(cacheKey, { url: finalUrl, timestamp: requestTimestamp });

    console.log(`[API UPLOAD ${requestId}] ✅ UPLOAD COMPLETO`);
    console.log(`[API UPLOAD ${requestId}]    URL base: ${baseUrl}`);
    console.log(`[API UPLOAD ${requestId}]    URL final: ${finalUrl}`);
    console.log(`[API UPLOAD ${requestId}]    Cache-bust: ${cacheBust}`);
    console.log(`\n${'='.repeat(80)}\n`);

    return new Response(
      JSON.stringify({
        success: true,
        url: finalUrl,
        path: uploadData.path,
        timestamp: now,
        debug: {
          fileName,
          baseUrl,
          cacheBust,
          requestId,
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
    console.error(`[API UPLOAD ${requestId}]    Stack:`, error.stack);

    return new Response(
      JSON.stringify({
        error: 'Erro interno',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    const authToken = cookies.get('sb-access-token')?.value;
    if (!authToken) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const path = url.searchParams.get('path');

    if (!path) {
      return new Response(JSON.stringify({ error: 'Path não fornecido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error: deleteError } = await supabaseAdmin.storage
      .from('imagens')
      .remove([path]);

    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
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
