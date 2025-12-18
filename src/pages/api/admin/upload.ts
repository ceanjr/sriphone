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

// Helper para gerar hash simples
function simpleHash(buffer: Uint8Array): string {
  let hash = 0;
  const sampleSize = Math.min(buffer.length, 1024);
  for (let i = 0; i < sampleSize; i++) {
    hash = (hash << 5) - hash + buffer[i];
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).substring(0, 8);
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  console.log(`[API UPLOAD ${requestId}] ========================================`);
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
      console.error(`[API UPLOAD ${requestId}] ❌ Erro ao parsear FormData:`, error);
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
      console.error(`[API UPLOAD ${requestId}] ❌ Nenhum arquivo enviado no FormData`);
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
      name: file.name, // Nome enviado pelo frontend (deve ser único)
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
      console.error(`[API UPLOAD ${requestId}] ❌ Arquivo muito grande:`, file.size);
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

    // 5. Gerar nome REALMENTE único usando UUID
    const timestamp = Date.now();
    const uuid = crypto.randomUUID();
    
    // Converter para buffer para gerar hash
    let arrayBuffer: ArrayBuffer;
    let buffer: Uint8Array;
    try {
      arrayBuffer = await file.arrayBuffer();
      buffer = new Uint8Array(arrayBuffer);
    } catch (error: any) {
      console.error(`[API UPLOAD ${requestId}] ❌ Erro ao converter arquivo:`, error);
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

    const hashStr = simpleHash(buffer);
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';

    // Nome final: timestamp-uuid-hash.ext
    const uniqueFileName = `${timestamp}-${uuid}-${hashStr}.${fileExt}`;

    console.log(`[API UPLOAD ${requestId}] ✅ Nome único gerado:`, uniqueFileName);

    // Bucket = 'imagens', Path = 'produtos/filename.jpg'
    const filePath = `produtos/${uniqueFileName}`;

    console.log(`[API UPLOAD ${requestId}] Iniciando upload para Supabase...`);
    
    // 6. Upload usando SUPABASE ADMIN
    let uploadData;
    let uploadError;
    try {
      const result = await supabaseAdmin.storage
        .from('imagens')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
          cacheControl: '3600',
        });

      uploadData = result.data;
      uploadError = result.error;
    } catch (error: any) {
      console.error(`[API UPLOAD ${requestId}] ❌ Exceção durante upload:`, error);
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
      console.error(`[API UPLOAD ${requestId}] ❌ Erro no upload do Supabase:`, uploadError);
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

    // 7. Obter URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from('imagens')
      .getPublicUrl(filePath);

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

    // 8. Adicionar cache-busting na URL retornada (para o frontend ver que é novo)
    // Mas a URL base salva no banco deve ser limpa depois pelo frontend se quiser
    const finalUrl = `${urlData.publicUrl}?t=${timestamp}`;

    const elapsed = Date.now() - startTime;
    console.log(`[API UPLOAD ${requestId}] ✅ Upload concluído em ${elapsed}ms`);
    console.log(`[API UPLOAD ${requestId}] URL: ${finalUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        urls: [finalUrl],
        url: finalUrl,
        path: filePath,
        timestamp: timestamp,
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
