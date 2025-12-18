// src/pages/api/admin/cleanup-upload.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabaseImageCleanup';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { urls, bucket } = await request.json();
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nenhuma URL fornecida.' }),
        { status: 400 }
      );
    }
    const bucketName = bucket || 'produtos';
    // Extrai o caminho relativo do arquivo a partir da URL
    const paths = urls
      .map((url: string) => {
        const match = url.match(/storage\/v1\/object\/public\/(.+)/);
        return match ? match[1] : null;
      })
      .filter(Boolean);
    if (paths.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Nenhum caminho válido extraído.',
        }),
        { status: 400 }
      );
    }
    const { data, error } = await supabase.storage
      .from(bucketName)
      .remove(paths);
    if (error) {
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500 }
      );
    }
    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
};
