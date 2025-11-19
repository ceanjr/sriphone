import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { logCategoryAction } from '../../../../lib/logger';

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

export const GET: APIRoute = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('categorias')
      .select('*')
      .order('nome');

    if (error) throw error;

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
    console.error('Error fetching categorias:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erro ao buscar categorias' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const { userAgent, ipAddress } = getRequestInfo(request);
  const userEmail = await getUserEmail(cookies);

  try {
    const { nome } = await request.json();

    if (!nome || nome.trim() === '') {
      return new Response(
        JSON.stringify({ success: false, error: 'Nome é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('categorias')
      .insert([{ nome: nome.trim() }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // conflito (duplicado)
        // Log de erro: categoria duplicada
        await logCategoryAction({
          action: 'add_category',
          categoryId: 'failed',
          categoryName: nome.trim(),
          userEmail,
          status: 'error',
          errorMessage: 'Categoria já existe',
          ipAddress,
          userAgent,
        });

        return new Response(
          JSON.stringify({ success: false, error: 'Categoria já existe' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Log de erro: falha ao criar categoria
      await logCategoryAction({
        action: 'add_category',
        categoryId: 'failed',
        categoryName: nome.trim(),
        userEmail,
        status: 'error',
        errorMessage: error.message,
        ipAddress,
        userAgent,
      });

      throw error;
    }

    // Log de sucesso: categoria criada
    await logCategoryAction({
      action: 'add_category',
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
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error: any) {
    console.error('Error creating categoria:', error);

    // Log de erro: exceção não tratada
    await logCategoryAction({
      action: 'add_category',
      categoryId: 'failed',
      categoryName: 'unknown',
      userEmail,
      status: 'error',
      errorMessage: error.message,
      ipAddress,
      userAgent,
    });

    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erro ao criar categoria' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
