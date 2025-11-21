// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';
import { supabase } from './lib/supabase';
import type { AstroCookies } from 'astro';

/**
 * Extrai o access token do request (header Authorization ou cookies via Astro API)
 */
function getAccessToken(request: Request, cookies: AstroCookies): string | null {
  // 1. Tentar pegar do Authorization header primeiro
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    console.log('[Middleware] Token encontrado no header Authorization');
    return token;
  }

  // 2. Tentar pegar dos cookies usando a API do Astro
  const accessToken = cookies.get('sb-access-token')?.value;
  if (accessToken) {
    console.log('[Middleware] Token encontrado no cookie sb-access-token');
    return accessToken;
  }

  // 3. Fallback para sb-auth-token (usado pelo cliente Supabase)
  const authToken = cookies.get('sb-auth-token')?.value;
  if (authToken) {
    console.log('[Middleware] Token encontrado no cookie sb-auth-token');
    return authToken;
  }

  console.log('[Middleware] Nenhum token encontrado');
  return null;
}

/**
 * Refresh a sessão usando o refresh token
 */
async function refreshSession(cookies: AstroCookies, refreshToken: string): Promise<{ user: any; error: any }> {
  try {
    console.log('[Middleware] Tentando refresh da sessão...');

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      console.log('[Middleware] Erro ao refresh:', error.message);
      // Limpar cookies inválidos
      cookies.delete('sb-access-token', { path: '/' });
      cookies.delete('sb-refresh-token', { path: '/' });
      cookies.delete('sb-expires-at', { path: '/' });
      return { user: null, error };
    }

    if (!data.session || !data.user) {
      console.log('[Middleware] Nenhuma sessão retornada no refresh');
      return { user: null, error: null };
    }

    console.log('[Middleware] Sessão refreshed com sucesso para:', data.user.email);

    // Atualizar cookies com novos tokens
    const isProduction = import.meta.env.PROD;
    const cookieMaxAge = 60 * 60 * 24 * 30; // 30 dias

    const cookieOptions = {
      path: '/',
      maxAge: cookieMaxAge,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
    };

    cookies.set('sb-access-token', data.session.access_token, cookieOptions);
    cookies.set('sb-refresh-token', data.session.refresh_token, cookieOptions);

    if (data.session.expires_at) {
      cookies.set('sb-expires-at', data.session.expires_at.toString(), {
        ...cookieOptions,
        httpOnly: false
      });
    }

    console.log('[Middleware] Cookies atualizados após refresh');
    return { user: data.user, error: null };
  } catch (error: any) {
    console.error('[Middleware] Exceção ao refresh:', error.message);
    return { user: null, error };
  }
}

/**
 * Verifica se o token é válido e retorna o usuário
 * Se o token expirou, tenta fazer refresh automaticamente
 */
async function verifyToken(accessToken: string, cookies: AstroCookies) {
  try {
    console.log('[Middleware] Verificando token com Supabase...');
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error) {
      console.log('[Middleware] Erro ao verificar token:', error.message);

      // Se o token expirou ou é inválido, tentar refresh
      if (error.message.includes('expired') || error.message.includes('invalid') || error.message.includes('Invalid')) {
        console.log('[Middleware] Token expirado/inválido, tentando refresh...');
        const refreshToken = cookies.get('sb-refresh-token')?.value;
        if (refreshToken) {
          return await refreshSession(cookies, refreshToken);
        }
      }

      return { user: null, error };
    }

    if (!user) {
      console.log('[Middleware] Token válido mas usuário não encontrado');
      return { user: null, error: null };
    }

    console.log('[Middleware] Usuário autenticado:', user.email);
    return { user, error: null };
  } catch (error: any) {
    console.error('[Middleware] Exceção ao verificar token:', error.message);

    // Tentar refresh em caso de exceção também
    const refreshToken = cookies.get('sb-refresh-token')?.value;
    if (refreshToken) {
      console.log('[Middleware] Tentando refresh após exceção...');
      return await refreshSession(cookies, refreshToken);
    }

    return { user: null, error };
  }
}

export const onRequest = defineMiddleware(async ({ request, locals, redirect, cookies }, next) => {
  const url = new URL(request.url);
  const isLoginPage = url.pathname === '/admin/login' || url.pathname === '/admin/login/';
  const isLogoutAPI = url.pathname === '/api/admin/auth/logout';
  const isAdminRoute = url.pathname.startsWith('/admin') && !isLoginPage;

  // Proteção contra loop de redirecionamento
  const redirectCount = parseInt(request.headers.get('x-redirect-count') || '0');
  if (redirectCount > 5) {
    console.error('[Middleware] ⚠️ LOOP DE REDIRECIONAMENTO DETECTADO! Contador:', redirectCount);
    console.error('[Middleware] 🛑 Parando para prevenir loop infinito');
    // Retorna página de erro em vez de redirecionar
    return new Response('Erro: Loop de redirecionamento detectado. Limpe o cache do navegador.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`[Middleware] 🌐 Request recebido`);
  console.log(`[Middleware] 📍 URL: ${url.pathname}`);
  console.log(`[Middleware] 🔗 Method: ${request.method}`);
  console.log(`[Middleware] 🔄 Redirect count: ${redirectCount}`);
  console.log(`[Middleware] 📋 isAdminRoute: ${isAdminRoute}`);
  console.log(`[Middleware] 🔐 isLoginPage: ${isLoginPage}`);
  console.log(`[Middleware] 🚪 isLogoutAPI: ${isLogoutAPI}`);

  // Não fazer verificação de auth na API de logout (deixar a API lidar com isso)
  if (isLogoutAPI) {
    console.log('[Middleware] ✅ API de logout, passando adiante sem verificação');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return next();
  }

  // Obter token uma única vez usando a API de cookies do Astro
  const accessToken = getAccessToken(request, cookies);

  // Verificar autenticação se houver token
  let user = null;
  if (accessToken) {
    const result = await verifyToken(accessToken, cookies);
    user = result.user;
    console.log(`[Middleware] 👤 Usuário encontrado: ${user ? user.email : 'NENHUM'}`);
  } else {
    // Sem access token, tentar refresh token diretamente
    const refreshToken = cookies.get('sb-refresh-token')?.value;
    if (refreshToken) {
      console.log('[Middleware] ⚠️ Sem access token, mas encontrado refresh token. Tentando refresh...');
      const result = await refreshSession(cookies, refreshToken);
      user = result.user;
      console.log(`[Middleware] 👤 Usuário após refresh: ${user ? user.email : 'NENHUM'}`);
    } else {
      console.log('[Middleware] ⚠️ Nenhum token de acesso encontrado');
    }
  }

  // Proteger rotas administrativas
  if (isAdminRoute) {
    if (!user) {
      console.log('[Middleware] 🚫 Rota admin sem autenticação, redirecionando para /admin/login');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Adicionar header para rastrear redirecionamentos
      const response = redirect('/admin/login');
      response.headers.set('x-redirect-count', String(redirectCount + 1));
      return response;
    }
    // Adicionar usuário aos locals para uso nas páginas
    locals.user = user;
    console.log('[Middleware] ✅ Acesso permitido à rota admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  // Redirecionar se já autenticado e tentar acessar login
  if (isLoginPage && user) {
    console.log('[Middleware] 🔄 Usuário autenticado tentando acessar login, redirecionando para /admin/produtos');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Redirecionar para /admin/produtos em vez de /admin/dashboard (que pode não existir)
    const response = redirect('/admin/produtos');
    response.headers.set('x-redirect-count', String(redirectCount + 1));
    return response;
  }

  console.log('[Middleware] ➡️ Passando para a próxima camada');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  return next();
});