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
  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(
    `[API UPLOAD ${requestId}] ========================================`
  );
  console.log(`[API UPLOAD ${requestId}] Nova requisição recebida`);

  try {
    // 1. Verificar autenticação
    const authToken = cookies.get('sb-access-token')?.value;

    if (!authToken) {
      console.error(`[API UPLOAD ${requestId}] ❌ Sem token de autenticação`);
      return new Response(
        JSON.stringify({ error: 'Não autorizado - faça login novamente' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Obter arquivo
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error: any) {
      console.error(
        `[API UPLOAD ${requestId}] ❌ Erro ao parsear FormData:`,
        error
      );
      return new Response(
        JSON.stringify({ error: 'Erro ao processar formulário' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const file = formData.get('file') as File;

    if (!file) {
      console.error(`[API UPLOAD ${requestId}] ❌ Nenhum arquivo enviado`);
      return new Response(
        JSON.stringify({ error: 'Nenhum arquivo foi enviado' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
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
        JSON.stringify({ error: `Tipo não permitido: ${file.type}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      console.error(`[API UPLOAD ${requestId}] ❌ Arquivo muito grande`);
      return new Response(
        JSON.stringify({ error: 'Arquivo muito grande (máx 10MB)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Converter para buffer
    let arrayBuffer: ArrayBuffer;
    let buffer: Uint8Array;
    try {
      arrayBuffer = await file.arrayBuffer();
      buffer = new Uint8Array(arrayBuffer);
    } catch (error: any) {
      console.error(`[API UPLOAD ${requestId}] ❌ Erro ao converter:`, error);
      return new Response(
        JSON.stringify({ error: 'Erro ao processar arquivo' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 6. 🔥 SOLUÇÃO: Nome único usando MESMO PADRÃO do Next.js
    // Formato: timestamp-random.ext (simples e eficaz)
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const fileExt = file.type.split('/')[1] || 'jpg';

    // Nome: timestamp-random.ext
    const fileName = `${timestamp}-${randomStr}.${fileExt}`;
    const filePath = `produtos/${fileName}`;

    console.log(`[API UPLOAD ${requestId}] ✅ Nome gerado: ${fileName}`);
    console.log(`[API UPLOAD ${requestId}]    Timestamp: ${timestamp}`);
    console.log(`[API UPLOAD ${requestId}]    Random: ${randomStr}`);
    console.log(`[API UPLOAD ${requestId}]    Path: ${filePath}`);

    // 7. Upload para Supabase
    console.log(`[API UPLOAD ${requestId}] 📤 Iniciando upload...`);

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('imagens')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false, // NUNCA sobrescrever
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error(
        `[API UPLOAD ${requestId}] ❌ Erro no upload:`,
        uploadError
      );
      return new Response(
        JSON.stringify({
          error: `Erro ao fazer upload: ${uploadError.message}`,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[API UPLOAD ${requestId}] ✅ Upload bem-sucedido`);
    console.log(`[API UPLOAD ${requestId}]    Path salvo: ${uploadData?.path}`);

    // 8. Verificar path retornado
    if (!uploadData || !uploadData.path) {
      console.error(`[API UPLOAD ${requestId}] ❌ Upload sem path retornado!`);
      return new Response(
        JSON.stringify({ error: 'Upload falhou - sem path' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 9. 🔥 CRÍTICO: Usar o path RETORNADO pelo upload
    const actualPath = uploadData.path;

    // 10. Obter URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from('imagens')
      .getPublicUrl(actualPath);

    if (!urlData || !urlData.publicUrl) {
      console.error(`[API UPLOAD ${requestId}] ❌ URL pública não retornada`);
      return new Response(
        JSON.stringify({ error: 'Erro ao obter URL pública' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 11. URL final (sem cache-busting adicional, já temos timestamp no nome)
    const finalUrl = urlData.publicUrl;

    console.log(`[API UPLOAD ${requestId}] ✅ Upload concluído`);
    console.log(`[API UPLOAD ${requestId}] 🔗 URL: ${finalUrl}`);
    console.log(
      `[API UPLOAD ${requestId}] ========================================`
    );

    return new Response(
      JSON.stringify({
        success: true,
        url: finalUrl,
        path: actualPath,
        timestamp: timestamp,
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
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('[API DELETE] ✅ Arquivo deletado');

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[API DELETE] ❌ ERRO FATAL:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
