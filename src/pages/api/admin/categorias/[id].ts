import type { APIRoute } from 'astro';
import { verifyAuth, getAuthenticatedSupabaseClient } from '../../../../lib/auth';

export const prerender = false;

// PUT - Atualizar categoria
export const PUT: APIRoute = async ({ params, request, cookies }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    const isAuth = await verifyAuth(cookies, authHeader);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id } = params;
    const body = await request.json();
    
    const supabase = getAuthenticatedSupabaseClient(cookies, authHeader);
    const { data, error } = await supabase
      .from('categorias')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ categoria: data }), {
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

// DELETE - Deletar categoria
export const DELETE: APIRoute = async ({ params, request, cookies }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    const isAuth = await verifyAuth(cookies, authHeader);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id } = params;
    
    const supabase = getAuthenticatedSupabaseClient(cookies, authHeader);
    // Use .select() to confirm which row was deleted.
    const { data, error } = await supabase
      .from('categorias')
      .delete()
      .eq('id', id)
      .select(); // Returns an array of deleted items

    if (error) {
      // This will catch specific DB errors, like foreign key violations
      throw error;
    }

    // If no error, but data is empty, it means nothing was deleted.
    // This can happen if the ID doesn't exist or if RLS silently prevents it.
    if (!data || data.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Falha ao deletar. A categoria pode não existir ou estar em uso.' 
      }), {
        status: 409, // Conflict
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If we get here, it means data contains the deleted category.
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    // Add a specific check for the foreign key violation code for a clearer message
    if (error.code === '23503') {
      return new Response(JSON.stringify({ 
        error: 'Esta categoria não pode ser deletada pois está sendo usada por produtos.' 
      }), {
        status: 409, // Conflict
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Generic catch-all
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
