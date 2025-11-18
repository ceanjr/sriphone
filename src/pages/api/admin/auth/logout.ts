import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  try {
    console.log('[Logout API] 🚪 Iniciando processo de logout...');

    // Limpar cookies de autenticação
    console.log('[Logout API] 🍪 Deletando cookie sb-access-token...');
    cookies.delete('sb-access-token', { path: '/' });

    console.log('[Logout API] 🍪 Deletando cookie sb-refresh-token...');
    cookies.delete('sb-refresh-token', { path: '/' });

    // Deletar também qualquer outro cookie relacionado ao Supabase
    console.log('[Logout API] 🍪 Deletando cookie sb-auth-token (se existir)...');
    cookies.delete('sb-auth-token', { path: '/' });

    console.log('[Logout API] ✅ Todos os cookies deletados com sucesso');

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });
  } catch (error: any) {
    console.error('[Logout API] ❌ Erro ao fazer logout:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
