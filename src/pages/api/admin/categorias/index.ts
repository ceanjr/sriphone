import type { APIRoute } from 'astro';
import { verifyAuth, getAuthenticatedSupabaseClient } from '../../../../lib/auth';

export const prerender = false;

const headers = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
};

function jsonResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), { status, headers });
}

function errorResponse(error: string, status: number = 500) {
  console.error(`[API Error ${status}]:`, error);
  return jsonResponse({ error }, status);
}

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    const isAuth = await verifyAuth(cookies, authHeader);
    
    if (!isAuth) {
      return errorResponse('Não autenticado', 401);
    }

    const supabase = getAuthenticatedSupabaseClient(cookies, authHeader);
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      console.error('[Supabase Error]:', error);
      return errorResponse(error.message || 'Erro ao buscar categorias', 500);
    }

    return jsonResponse({ categorias: data || [] });
  } catch (error: any) {
    return errorResponse(error.message || 'Erro interno do servidor', 500);
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    const isAuth = await verifyAuth(cookies, authHeader);
    
    if (!isAuth) {
      return errorResponse('Não autenticado', 401);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('JSON inválido', 400);
    }

    if (!body.nome || typeof body.nome !== 'string' || body.nome.trim() === '') {
      return errorResponse('O nome da categoria é obrigatório', 400);
    }

    const supabase = getAuthenticatedSupabaseClient(cookies, authHeader);
    const { data, error } = await supabase
      .from('categorias')
      .insert([{ nome: body.nome.trim() }])
      .select()
      .single();

    if (error) {
      console.error('[Supabase Error]:', error);
      
      if (error.code === '23505') {
        return errorResponse('Uma categoria com este nome já existe', 409);
      }

      return errorResponse(error.message || 'Erro ao criar categoria', 500);
    }

    return jsonResponse({ categoria: data }, 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Erro interno do servidor', 500);
  }
};
