import type { APIRoute } from 'astro';
import { verifyAuth, getAuthenticatedSupabaseClient } from '../../../../lib/auth';

export const prerender = false;

// GET - Listar todas as categorias
export const GET: APIRoute = async ({ request, cookies }) => {
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

    const supabase = getAuthenticatedSupabaseClient(cookies, authHeader);
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro Supabase ao listar categorias:', error);
      return new Response(JSON.stringify({ error: error.message || 'Erro ao listar categorias' }), {
        status: 500,
        headers,
      });
    }

    return new Response(JSON.stringify({ categorias: data || [] }), {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Erro ao listar categorias:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro ao listar categorias' }), {
      status: 500,
      headers,
    });
  }
};

// POST - Criar nova categoria
export const POST: APIRoute = async ({ request, cookies }) => {
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
      .insert([{ nome: body.nome.trim() }])
      .select()
      .single();

    if (error) {
      console.error('Erro Supabase ao criar categoria:', error);
      
      if (error.code === '23505' || (error.message && error.message.includes('duplicate key'))) {
        return new Response(JSON.stringify({ error: 'Uma categoria com este nome já existe.' }), {
          status: 409,
          headers,
        });
      }

      if (error.code === '23502') {
        return new Response(JSON.stringify({ error: 'O nome da categoria não pode ser nulo.' }), {
          status: 400,
          headers,
        });
      }

      return new Response(JSON.stringify({ error: error.message || 'Erro ao criar categoria' }), {
        status: 500,
        headers,
      });
    }

    return new Response(JSON.stringify({ categoria: data }), {
      status: 201,
      headers,
    });
  } catch (error: any) {
    console.error('Erro ao criar categoria:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Ocorreu um erro inesperado no servidor.' 
    }), {
      status: 500,
      headers,
    });
  }
};
