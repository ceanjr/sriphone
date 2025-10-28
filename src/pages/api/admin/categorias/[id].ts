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

    if (!body.nome || typeof body.nome !== 'string' || body.nome.trim() === '') {
      return errorResponse('O nome da categoria é obrigatório', 400);
    }

    const supabase = getAuthenticatedSupabaseClient(cookies, authHeader);
    const { data, error } = await supabase
      .from('categorias')
      .update({ nome: body.nome.trim() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Supabase Error]:', error);
      
      if (error.code === '23505') {
        return errorResponse('Uma categoria com este nome já existe', 409);
      }

      return errorResponse(error.message || 'Erro ao atualizar categoria', 500);
    }

    if (!data) {
      return errorResponse('Categoria não encontrada', 404);
    }

    return jsonResponse({ categoria: data });
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
      .from('categorias')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('[Supabase Error]:', error);
      
      if (error.code === '23503') {
        return errorResponse('Esta categoria não pode ser deletada pois está sendo usada por produtos', 409);
      }

      return errorResponse(error.message || 'Erro ao deletar categoria', 500);
    }

    if (!data || data.length === 0) {
      return errorResponse('Categoria não encontrada', 404);
    }

    return jsonResponse({ success: true });
  } catch (error: any) {
    return errorResponse(error.message || 'Erro interno do servidor', 500);
  }
};
