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

export const POST: APIRoute = async ({ request, cookies }) => {
  console.log('[API UPLOAD] ========================================');
  console.log('[API UPLOAD] Nova requisição recebida');

  try {
    // 1. Verificar autenticação
    const authToken = cookies.get('sb-access-token')?.value;

    if (!authToken) {
      console.error('[API UPLOAD] Sem token de autenticação');
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Obter arquivo do FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('[API UPLOAD] Nenhum arquivo enviado');
      return new Response(
        JSON.stringify({ error: 'Nenhum arquivo foi enviado' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[API UPLOAD] Arquivo recebido:', {
      name: file.name,
      size: (file.size / 1024).toFixed(2) + 'KB',
      type: file.type,
    });

    // 3. Validar tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.error('[API UPLOAD] Tipo inválido:', file.type);
      return new Response(
        JSON.stringify({ error: 'Tipo de arquivo não permitido' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 4. Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      console.error('[API UPLOAD] Arquivo muito grande:', file.size);
      return new Response(
        JSON.stringify({ error: 'Arquivo muito grande (máx 10MB)' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 5. Gerar nome ÚNICO com timestamp + random
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split('.').pop() || 'jpg';
    const uniqueFileName = `${timestamp}-${randomStr}.${fileExt}`;

    console.log('[API UPLOAD] Nome único gerado:', uniqueFileName);

    // 6. Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // 7. Upload para Supabase Storage
    const filePath = `produtos/${uniqueFileName}`;

    console.log('[API UPLOAD] Fazendo upload para Supabase:', filePath);

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('produtos')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false, // IMPORTANTE: Nunca sobrescrever
        cacheControl: 'no-cache', // IMPORTANTE: Sem cache
      });

    if (uploadError) {
      console.error('[API UPLOAD] Erro no upload:', uploadError);
      return new Response(
        JSON.stringify({
          error: `Erro ao fazer upload: ${uploadError.message}`,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[API UPLOAD] Upload bem-sucedido:', uploadData);

    // 8. Obter URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from('produtos')
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      console.error('[API UPLOAD] Erro ao obter URL pública');
      return new Response(
        JSON.stringify({ error: 'Erro ao obter URL pública' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const finalUrl = urlData.publicUrl;
    console.log('[API UPLOAD] ✅ Upload concluído com sucesso!');
    console.log('[API UPLOAD] URL:', finalUrl);
    console.log('[API UPLOAD] ========================================');

    // 9. Retornar URL no formato esperado
    return new Response(
      JSON.stringify({
        urls: [finalUrl], // IMPORTANTE: Array de URLs
        url: finalUrl, // Também retornar singular para compatibilidade
        path: filePath,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('[API UPLOAD] ❌ Erro fatal:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno no servidor' }),
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
      return new Response(JSON.stringify({ error: 'Caminho não fornecido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error: deleteError } = await supabaseAdmin.storage
      .from('produtos')
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
