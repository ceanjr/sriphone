import type { APIRoute } from 'astro';
import { verifyAuth, getAuthenticatedSupabaseClient } from '../../../../lib/auth';

export const prerender = false;

// PUT - Atualizar categoria
export const PUT: APIRoute = async ({ params, request, cookies }) => {
  const headers = { 
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
  };
  
  try {
    const authHeader = request.headers.get('Authorization');
    const isAuth = await verifyAuth(cookies, authHeader);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers,
      });
    }

    const { id } = params;
    
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'JSON inválido' }), {
        status: 400,
        headers,
      });
    }

    if (!body || !body.nome || typeof body.nome !== 'string' || body.nome.trim() === '') {
      return new Response(JSON.stringify({ error: 'O nome da categoria é obrigatório.' }), {
        status: 400,
        headers,
      });
    }
    
    const supabase = getAuthenticatedSupabaseClient(cookies, authHeader);
    const { data, error } = await supabase
      .from('categorias')
      .update({ nome: body.nome.trim() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro Supabase ao atualizar categoria:', error);
      
      if (error.code === '23505' || (error.message && error.message.includes('duplicate key'))) {
        return new Response(JSON.stringify({ error: 'Uma categoria com este nome já existe.' }), {
          status: 409,
          headers,
        });
      }

      return new Response(JSON.stringify({ error: error.message || 'Erro ao atualizar categoria' }), {
        status: 500,
        headers,
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Categoria não encontrada' }), {
        status: 404,
        headers,
      });
    }

    return new Response(JSON.stringify({ categoria: data }), {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Erro ao atualizar categoria:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro ao atualizar categoria' }), {
      status: 500,
      headers,
    });
  }
};

// DELETE - Deletar categoria
export const DELETE: APIRoute = async ({ params, request, cookies }) => {
  const headers = { 
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
  };
  
  try {
    const authHeader = request.headers.get('Authorization');
    const isAuth = await verifyAuth(cookies, authHeader);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers,
      });
    }

    const { id } = params;
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID da categoria não fornecido' }), {
        status: 400,
        headers,
      });
    }
    
    const supabase = getAuthenticatedSupabaseClient(cookies, authHeader);
    const { data, error } = await supabase
      .from('categorias')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Erro Supabase ao deletar categoria:', error);
      
      if (error.code === '23503') {
        return new Response(JSON.stringify({ 
          error: 'Esta categoria não pode ser deletada pois está sendo usada por produtos.' 
        }), {
          status: 409,
          headers,
        });
      }

      return new Response(JSON.stringify({ error: error.message || 'Erro ao deletar categoria' }), {
        status: 500,
        headers,
      });
    }

    if (!data || data.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Categoria não encontrada' 
      }), {
        status: 404,
        headers,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Erro ao deletar categoria:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro ao deletar categoria' }), {
      status: 500,
      headers,
    });
  }
};
