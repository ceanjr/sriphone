import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { logCategoryAction } from '../../../../../lib/logger';

export const prerender = false;

// Helper para obter informações do request
function getRequestInfo(request: Request) {
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                    request.headers.get('x-real-ip') ||
                    'unknown';
  return { userAgent, ipAddress };
}

// Helper para obter email do usuário autenticado
async function getUserEmail(cookies: any) {
  try {
    const sessionCookie = cookies.get('sb-access-token')?.value;
    if (!sessionCookie) return undefined;

    const payload = JSON.parse(atob(sessionCookie.split('.')[1]));
    return payload.email;
  } catch {
    return undefined;
  }
}

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  const { userAgent, ipAddress } = getRequestInfo(request);
  const userEmail = await getUserEmail(cookies);

  try {
    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'ID é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { nome } = await request.json();

    if (!nome || nome.trim() === '') {
      return new Response(
        JSON.stringify({ success: false, error: 'Nome é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('categorias')
      .update({ nome: nome.trim() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Log de erro: categoria duplicada
        await logCategoryAction({
          action: 'update_category',
          categoryId: id,
          categoryName: nome.trim(),
          userEmail,
          status: 'error',
          errorMessage: 'Categoria já existe',
          ipAddress,
          userAgent,
        });

        return new Response(
          JSON.stringify({ success: false, error: 'Categoria já existe' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Log de erro: falha ao atualizar categoria
      await logCategoryAction({
        action: 'update_category',
        categoryId: id,
        categoryName: nome.trim(),
        userEmail,
        status: 'error',
        errorMessage: error.message,
        ipAddress,
        userAgent,
      });

      throw error;
    }

    // Log de sucesso: categoria atualizada
    await logCategoryAction({
      action: 'update_category',
      categoryId: data.id,
      categoryName: data.nome,
      userEmail,
      status: 'success',
      ipAddress,
      userAgent,
    });

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error: any) {
    console.error('Error updating categoria:', error);

    // Log de erro: exceção não tratada
    await logCategoryAction({
      action: 'update_category',
      categoryId: id || 'unknown',
      categoryName: 'unknown',
      userEmail,
      status: 'error',
      errorMessage: error.message,
      ipAddress,
      userAgent,
    });

    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erro ao editar categoria' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ params, request, cookies }) => {
  const { userAgent, ipAddress } = getRequestInfo(request);
  const userEmail = await getUserEmail(cookies);

  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'ID é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Primeiro, buscar a categoria para obter o nome antes de deletar
    const { data: categoria } = await supabaseAdmin
      .from('categorias')
      .select('nome')
      .eq('id', id)
      .single();

    const { error } = await supabaseAdmin
      .from('categorias')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '23503') {
        // Log de erro: categoria em uso
        await logCategoryAction({
          action: 'delete_category',
          categoryId: id,
          categoryName: categoria?.nome || 'unknown',
          userEmail,
          status: 'error',
          errorMessage: 'Categoria em uso por produtos',
          ipAddress,
          userAgent,
        });

        return new Response(
          JSON.stringify({ success: false, error: 'Categoria em uso por produtos' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Log de erro: falha ao deletar categoria
      await logCategoryAction({
        action: 'delete_category',
        categoryId: id,
        categoryName: categoria?.nome || 'unknown',
        userEmail,
        status: 'error',
        errorMessage: error.message,
        ipAddress,
        userAgent,
      });

      throw error;
    }

    // Log de sucesso: categoria deletada
    await logCategoryAction({
      action: 'delete_category',
      categoryId: id,
      categoryName: categoria?.nome || 'unknown',
      userEmail,
      status: 'success',
      ipAddress,
      userAgent,
    });

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error: any) {
    console.error('Error deleting categoria:', error);

    // Log de erro: exceção não tratada
    await logCategoryAction({
      action: 'delete_category',
      categoryId: id || 'unknown',
      categoryName: 'unknown',
      userEmail,
      status: 'error',
      errorMessage: error.message,
      ipAddress,
      userAgent,
    });

    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erro ao deletar categoria' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
