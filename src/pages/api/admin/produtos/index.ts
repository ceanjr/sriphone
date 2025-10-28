import type { APIRoute } from 'astro';
import { verifyAuth, getAuthenticatedSupabaseClient } from '../../../../lib/auth';

export const prerender = false;

// GET - Listar todos os produtos
export const GET: APIRoute = async ({ request, cookies }) => {
  const headers = { 'Content-Type': 'application/json' };
  
  try {
    const authHeader = request.headers.get('Authorization');
    const isAuth = await verifyAuth(cookies, authHeader);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers,
      });
    }

    const supabase = getAuthenticatedSupabaseClient(cookies, authHeader);
    const { data, error } = await supabase
      .from('produtos')
      .select('*, categoria:categoria_id(id, nome)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro Supabase ao listar produtos:', error);
      return new Response(JSON.stringify({ error: error.message || 'Erro ao listar produtos' }), {
        status: 500,
        headers,
      });
    }

    return new Response(JSON.stringify({ produtos: data || [] }), {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Erro ao listar produtos:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro ao listar produtos' }), {
      status: 500,
      headers,
    });
  }
};

// POST - Criar novo produto
export const POST: APIRoute = async ({ request, cookies }) => {
  const headers = { 'Content-Type': 'application/json' };
  
  try {
    const authHeader = request.headers.get('Authorization');
    const isAuth = await verifyAuth(cookies, authHeader);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers,
      });
    }

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
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('Erro Supabase ao criar produto:', error);
      
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

      return new Response(JSON.stringify({ error: error.message || 'Erro ao criar produto' }), {
        status: 500,
        headers,
      });
    }

    return new Response(JSON.stringify({ produto: data }), {
      status: 201,
      headers,
    });
  } catch (error: any) {
    console.error('Erro ao criar produto:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro ao criar produto' }), {
      status: 500,
      headers,
    });
  }
};
