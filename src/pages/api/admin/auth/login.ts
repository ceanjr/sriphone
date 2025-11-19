import type { APIRoute } from 'astro';
import { login } from '../../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    console.log('[Login API] 🔐 Iniciando processo de login...');
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      console.log('[Login API] ❌ Email ou senha não fornecidos');
      return new Response(JSON.stringify({ error: 'Email e senha são obrigatórios' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('[Login API] 📧 Autenticando:', email);
    const data = await login(email, password);

    if (!data.session) {
      console.log('[Login API] ❌ Nenhuma sessão retornada pelo Supabase');
      return new Response(JSON.stringify({ error: 'Erro ao criar sessão' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('[Login API] ✅ Sessão criada com sucesso');
    console.log('[Login API] 📅 Expira em:', new Date(data.session.expires_at! * 1000).toISOString());

    // Detectar ambiente
    const isProduction = import.meta.env.PROD;
    const isVercel = !!process.env.VERCEL;
    console.log('[Login API] 🌍 Ambiente:', {
      isProduction,
      isVercel,
      url: request.url
    });

    // Configuração de cookies mais robusta
    // maxAge: 30 dias (em segundos)
    const cookieMaxAge = 60 * 60 * 24 * 30; // 30 dias

    const cookieOptions = {
      path: '/',
      maxAge: cookieMaxAge,
      httpOnly: true,
      secure: isProduction, // true em produção (HTTPS)
      sameSite: 'lax' as const, // 'lax' funciona melhor que 'strict' para auth
    };

    console.log('[Login API] 🍪 Configurando cookies com opções:', {
      ...cookieOptions,
      maxAge: `${cookieMaxAge}s (${cookieMaxAge / 60 / 60 / 24} dias)`
    });

    // Salvar access token
    cookies.set('sb-access-token', data.session.access_token, cookieOptions);
    console.log('[Login API] ✅ Cookie sb-access-token definido');

    // Salvar refresh token
    cookies.set('sb-refresh-token', data.session.refresh_token, cookieOptions);
    console.log('[Login API] ✅ Cookie sb-refresh-token definido');

    // Salvar informação de quando expira (para debug)
    if (data.session.expires_at) {
      cookies.set('sb-expires-at', data.session.expires_at.toString(), {
        ...cookieOptions,
        httpOnly: false // Permitir JS ler isso para debug
      });
      console.log('[Login API] ✅ Cookie sb-expires-at definido');
    }

    console.log('[Login API] 🎉 Login concluído com sucesso para:', email);

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: {
        expires_at: data.session.expires_at
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('[Login API] ❌ Erro no login:', error.message);
    console.error('[Login API] Stack:', error.stack);

    // Mensagens de erro mais específicas
    let errorMessage = 'Erro ao fazer login';

    if (error.message?.includes('Invalid login credentials')) {
      errorMessage = 'Email ou senha incorretos';
    } else if (error.message?.includes('Email not confirmed')) {
      errorMessage = 'Email não confirmado';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
