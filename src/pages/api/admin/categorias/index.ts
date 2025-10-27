import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import { verifyAuth } from '../../../../lib/auth';

export const prerender = false;

// GET - Listar todas as categorias
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
    const isAuth = await verifyAuth(cookies);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    
    const { data, error } = await supabase
      .from('categorias')
      .insert([body])
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ categoria: data }), {
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
