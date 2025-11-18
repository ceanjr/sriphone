import type { APIRoute } from 'astro';
import { login } from '../../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    console.log('[Login API] Iniciando processo de login...');
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      console.log('[Login API] Email ou senha não fornecidos');
      return new Response(JSON.stringify({ error: 'Email e senha são obrigatórios' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('[Login API] Autenticando com Supabase para:', email);
    const data = await login(email, password);

    // Set session cookie
    if (data.session) {
      // secure: true apenas em produção (HTTPS)
      const isProduction = import.meta.env.PROD;
      console.log('[Login API] Sessão recebida do Supabase, configurando cookies...');
      console.log('[Login API] Modo:', isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO');

      cookies.set('sb-access-token', data.session.access_token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        secure: isProduction, // Apenas HTTPS em produção
        sameSite: 'lax',
      });

      cookies.set('sb-refresh-token', data.session.refresh_token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        secure: isProduction, // Apenas HTTPS em produção
        sameSite: 'lax',
      });

      console.log('[Login API] ✅ Cookies configurados com sucesso');
      console.log('[Login API] - httpOnly: true, secure:', isProduction, ', sameSite: lax');
    } else {
      console.log('[Login API] ⚠️ Nenhuma sessão retornada pelo Supabase');
    }

    console.log('[Login API] ✅ Login concluído com sucesso para:', email);
    return new Response(JSON.stringify({
      success: true,
      user: data.user,
      session: data.session
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Login API] ❌ Erro no login:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
