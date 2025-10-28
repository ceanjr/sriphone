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
      .from('produtos')
      .select('*, categoria:categoria_id(id, nome)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase Error]:', error);
      return errorResponse(error.message || 'Erro ao buscar produtos', 500);
    }

    return jsonResponse({ produtos: data || [] });
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

    // Validações
    if (!body.nome || typeof body.nome !== 'string' || body.nome.trim() === '') {
      return errorResponse('O nome do produto é obrigatório', 400);
    }

    if (!body.codigo || typeof body.codigo !== 'string' || body.codigo.trim() === '') {
      return errorResponse('O código do produto é obrigatório', 400);
    }

    if (!body.preco || isNaN(parseFloat(body.preco)) || parseFloat(body.preco) <= 0) {
      return errorResponse('O preço do produto é obrigatório e deve ser maior que zero', 400);
    }

    if (!body.categoria_id) {
      return errorResponse('A categoria do produto é obrigatória', 400);
    }

    const supabase = getAuthenticatedSupabaseClient(cookies, authHeader);
    const { data, error } = await supabase
      .from('produtos')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('[Supabase Error]:', error);
      
      if (error.code === '23505') {
        return errorResponse('Um produto com este código já existe', 409);
      }

      if (error.code === '23503') {
        return errorResponse('Categoria inválida', 400);
      }

      return errorResponse(error.message || 'Erro ao criar produto', 500);
    }

    return jsonResponse({ produto: data }, 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Erro interno do servidor', 500);
  }
};
