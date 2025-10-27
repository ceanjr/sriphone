import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import { verifyAuth } from '../../../../lib/auth';

export const prerender = false;

// GET - Listar todos os produtos
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const isAuth = await verifyAuth(cookies);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase
      .from('produtos')
      .select('*, categoria:categoria_id(id, nome)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify({ produtos: data }), {
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

// POST - Criar novo produto
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const isAuth = await verifyAuth(cookies);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    
    const { data, error } = await supabase
      .from('produtos')
      .insert([body])
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ produto: data }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
