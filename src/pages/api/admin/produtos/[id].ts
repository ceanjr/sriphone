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

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    const isAuth = await verifyAuth(cookies, authHeader);
    
    if (!isAuth) {
      return errorResponse('Não autenticado', 401);
    }

    const { id } = params;
    if (!id) {
      return errorResponse('ID não fornecido', 400);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('JSON inválido', 400);
    }

    const supabase = getAuthenticatedSupabaseClient(cookies, authHeader);
    const { data, error } = await supabase
      .from('produtos')
      .update(body)
      .eq('id', id)
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

      return errorResponse(error.message || 'Erro ao atualizar produto', 500);
    }

    if (!data) {
      return errorResponse('Produto não encontrado', 404);
    }

    return jsonResponse({ produto: data });
  } catch (error: any) {
    return errorResponse(error.message || 'Erro interno do servidor', 500);
  }
};

export const DELETE: APIRoute = async ({ params, request, cookies }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    const isAuth = await verifyAuth(cookies, authHeader);
    
    if (!isAuth) {
      return errorResponse('Não autenticado', 401);
    }

    const { id } = params;
    if (!id) {
      return errorResponse('ID não fornecido', 400);
    }

    const supabase = getAuthenticatedSupabaseClient(cookies, authHeader);
    const { data, error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('[Supabase Error]:', error);
      return errorResponse(error.message || 'Erro ao deletar produto', 500);
    }

    if (!data || data.length === 0) {
      return errorResponse('Produto não encontrado', 404);
    }

    return jsonResponse({ success: true });
  } catch (error: any) {
    return errorResponse(error.message || 'Erro interno do servidor', 500);
  }
};
