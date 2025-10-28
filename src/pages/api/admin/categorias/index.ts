import type { APIRoute } from 'astro';
import { verifyAuth, getAuthenticatedSupabaseClient } from '../../../../lib/auth';

export const prerender = false;

// GET - Listar todas as categorias
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    const isAuth = await verifyAuth(cookies, authHeader);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = getAuthenticatedSupabaseClient(cookies, authHeader);
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('nome', { ascending: true });

    if (error) throw error;

    return new Response(JSON.stringify({ categorias: data }), {
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

// POST - Criar nova categoria
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    const isAuth = await verifyAuth(cookies, authHeader);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();

    // Validate the request body
    if (!body || !body.nome || typeof body.nome !== 'string' || body.nome.trim() === '') {
      return new Response(JSON.stringify({ error: 'O nome da categoria é obrigatório.' }), {
        status: 400, // Bad Request
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const supabase = getAuthenticatedSupabaseClient(cookies, authHeader);
    const { data, error } = await supabase
      .from('categorias')
      .insert([{ nome: body.nome.trim() }]) // Use a cleaned-up body
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ categoria: data }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    // Handle specific DB errors
    if (error.code === '23505') { // Unique violation
      return new Response(JSON.stringify({ error: 'Uma categoria com este nome já existe.' }), {
        status: 409, // Conflict
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (error.code === '23502') { // Not-null violation
        return new Response(JSON.stringify({ error: 'O nome da categoria não pode ser nulo.' }), {
            status: 400, // Bad request
            headers: { 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
