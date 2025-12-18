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

// ✅ CORREÇÃO 1: Cache mais específico - incluir timestamp da requisição
const recentUploads = new Map<
  string,
  { url: string; timestamp: number; requestId: string }
>();

// Contador global para garantir unicidade absoluta
let uploadCounter = 0;

// Limpar cache antigo a cada minuto
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of recentUploads.entries()) {
    if (now - value.timestamp > 30000) {
      // ✅ CORREÇÃO 2: Reduzir para 30s
      recentUploads.delete(key);
    }
  }
}, 30000);

export const POST: APIRoute = async ({ request, cookies }) => {
  const requestId = crypto.randomUUID().substring(0, 8);
  const requestTimestamp = Date.now();

  // ✅ CORREÇÃO 3: Incrementar contador para garantir unicidade absoluta
  const currentCount = ++uploadCounter;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`[API UPLOAD ${requestId}] NOVA REQUISIÇÃO #${currentCount}`);
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

    // 5. ✅ CORREÇÃO 4: Hash mais específico (incluir timestamp nos primeiros bytes)
    const hashInput = new Uint8Array([
      ...buffer.slice(0, 10000), // Primeiros 10KB
      ...new TextEncoder().encode(requestTimestamp.toString()),
      ...new TextEncoder().encode(currentCount.toString()),
    ]);

    const contentHash = crypto
      .createHash('sha256')
      .update(hashInput)
      .digest('hex')
      .substring(0, 16);

    console.log(
      `[API UPLOAD ${requestId}] 🔐 Hash do conteúdo: ${contentHash}`
    );

    // 6. ✅ CORREÇÃO 5: Cache key mais específico
    const cacheKey = `${contentHash}-${file.size}-${file.name}-${requestTimestamp}`;
    const cached = recentUploads.get(cacheKey);

    // ✅ CORREÇÃO 6: Janela de duplicação muito menor (2 segundos)
    if (cached && requestTimestamp - cached.timestamp < 2000) {
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

    // 7. ✅ CORREÇÃO 7: Nome ÚNICO com MÁXIMA unicidade garantida
    const now = Date.now();
    const nanotime = performance
      .now()
      .toString()
      .replace('.', '')
      .substring(0, 12);
    const random1 = Math.random().toString(36).substring(2, 12);
    const random2 = crypto.randomBytes(6).toString('hex');
    const random3 = crypto.randomUUID().substring(0, 8); // ✅ UUID adicional
    const fileExt = file.type.split('/')[1] || 'jpg';

    // ✅ CORREÇÃO 8: Incluir contador no nome do arquivo
    const fileName = `${now}-${nanotime}-${currentCount}-${random1}-${random2}-${random3}-${contentHash}.${fileExt}`;
    const filePath = `produtos/${fileName}`;

    console.log(`[API UPLOAD ${requestId}] 🎯 Nome gerado:`);
    console.log(`[API UPLOAD ${requestId}]    Nome: ${fileName}`);
    console.log(`[API UPLOAD ${requestId}]    Path: ${filePath}`);
    console.log(`[API UPLOAD ${requestId}]    Componentes:`);
    console.log(`[API UPLOAD ${requestId}]      - Timestamp: ${now}`);
    console.log(`[API UPLOAD ${requestId}]      - Nanotime: ${nanotime}`);
    console.log(`[API UPLOAD ${requestId}]      - Counter: ${currentCount}`);
    console.log(`[API UPLOAD ${requestId}]      - Random1: ${random1}`);
    console.log(`[API UPLOAD ${requestId}]      - Random2: ${random2}`);
    console.log(`[API UPLOAD ${requestId}]      - Random3: ${random3}`);
    console.log(`[API UPLOAD ${requestId}]      - Hash: ${contentHash}`);

    // 8. Upload para Supabase
    console.log(
      `[API UPLOAD ${requestId}] 📤 Iniciando upload para Supabase...`
    );

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('imagens')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false, // ✅ CRÍTICO: Nunca sobrescrever
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error(
        `[API UPLOAD ${requestId}] ❌ Erro no upload:`,
        uploadError
      );

      // ✅ CORREÇÃO 9: Se o arquivo já existe, gerar novo nome e tentar novamente
      if (
        uploadError.message?.includes('already exists') ||
        uploadError.message?.includes('duplicate')
      ) {
        console.warn(
          `[API UPLOAD ${requestId}] ⚠️ Arquivo já existe, gerando novo nome...`
        );

        const retryFileName = `${now}-${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
        const retryFilePath = `produtos/${retryFileName}`;

        const { data: retryData, error: retryError } =
          await supabaseAdmin.storage
            .from('imagens')
            .upload(retryFilePath, buffer, {
              contentType: file.type,
              upsert: false,
              cacheControl: '3600',
            });

        if (retryError) {
          return new Response(
            JSON.stringify({
              error: `Erro no upload (retry): ${retryError.message}`,
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Usar dados do retry
        console.log(`[API UPLOAD ${requestId}] ✅ Upload bem-sucedido (retry)`);

        const { data: urlData } = supabaseAdmin.storage
          .from('imagens')
          .getPublicUrl(retryData.path);

        const baseUrl = urlData.publicUrl;
        const cacheBust = `t=${Date.now()}&r=${crypto
          .randomBytes(4)
          .toString('hex')}&c=${currentCount}`;
        const finalUrl = `${baseUrl}?${cacheBust}`;

        recentUploads.set(cacheKey, {
          url: finalUrl,
          timestamp: requestTimestamp,
          requestId,
        });

        return new Response(
          JSON.stringify({
            success: true,
            url: finalUrl,
            path: retryData.path,
            timestamp: now,
            retried: true,
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
          }
        );
      }

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

    // 10. Obter URL pública
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

    // 11. ✅ CORREÇÃO 10: Cache-busting com contador
    const cacheBust = `t=${now}&r=${random1}&n=${nanotime}&c=${currentCount}`;
    const finalUrl = `${baseUrl}?${cacheBust}`;

    // 12. Salvar no cache com requestId
    recentUploads.set(cacheKey, {
      url: finalUrl,
      timestamp: requestTimestamp,
      requestId,
    });

    console.log(`[API UPLOAD ${requestId}] ✅ UPLOAD COMPLETO`);
    console.log(`[API UPLOAD ${requestId}]    URL base: ${baseUrl}`);
    console.log(`[API UPLOAD ${requestId}]    URL final: ${finalUrl}`);
    console.log(`[API UPLOAD ${requestId}]    Cache-bust: ${cacheBust}`);
    console.log(`[API UPLOAD ${requestId}]    Counter: ${currentCount}`);
    console.log(`\n${'='.repeat(80)}\n`);

    return new Response(
      JSON.stringify({
        success: true,
        url: finalUrl,
        path: uploadData.path,
        timestamp: now,
        uploadNumber: currentCount,
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
