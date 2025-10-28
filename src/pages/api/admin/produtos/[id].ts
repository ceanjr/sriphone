import type { APIRoute } from 'astro';
import { verifyAuth, getAuthenticatedSupabaseClient } from '../../../../lib/auth';

export const prerender = false;

// PUT - Atualizar produto
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
      return new Response(JSON.stringify({ error: 'O nome do produto é obrigatório.' }), {
        status: 400,
        headers,
      });
    }
    
    const supabase = getAuthenticatedSupabaseClient(cookies, authHeader);
    const { data, error } = await supabase
      .from('produtos')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro Supabase ao atualizar produto:', error);
      
      if (error.code === '23505' || (error.message && error.message.includes('duplicate key'))) {
        return new Response(JSON.stringify({ error: 'Um produto com este nome já existe.' }), {
          status: 409,
          headers,
        });
      }

      if (error.code === '23503') {
        return new Response(JSON.stringify({ error: 'Categoria inválida.' }), {
          status: 400,
          headers,
        });
      }

      return new Response(JSON.stringify({ error: error.message || 'Erro ao atualizar produto' }), {
        status: 500,
        headers,
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Produto não encontrado' }), {
        status: 404,
        headers,
      });
    }

    return new Response(JSON.stringify({ produto: data }), {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Erro ao atualizar produto:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro ao atualizar produto' }), {
      status: 500,
      headers,
    });
  }
};

// DELETE - Deletar produto
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
      return new Response(JSON.stringify({ error: 'ID do produto não fornecido' }), {
        status: 400,
        headers,
      });
    }
    
    const supabase = getAuthenticatedSupabaseClient(cookies, authHeader);
    const { data, error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Erro Supabase ao deletar produto:', error);
      return new Response(JSON.stringify({ error: error.message || 'Erro ao deletar produto' }), {
        status: 500,
        headers,
      });
    }

    if (!data || data.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Produto não encontrado' 
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
    console.error('Erro ao deletar produto:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro ao deletar produto' }), {
      status: 500,
      headers,
    });
  }
};
