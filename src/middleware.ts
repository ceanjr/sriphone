// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';
import { supabase } from './lib/supabase';

/**
 * Extrai o access token do request (header Authorization ou cookies via Astro API)
 */
function getAccessToken(request: Request, cookies: any): string | null {
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
 * Verifica se o token é válido e retorna o usuário
 */
async function verifyToken(accessToken: string) {
  try {
    console.log('[Middleware] Verificando token com Supabase...');
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error) {
      console.log('[Middleware] Erro ao verificar token:', error.message);
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
    return { user: null, error };
  }
}

export const onRequest = defineMiddleware(async ({ request, locals, redirect, cookies }, next) => {
  const url = new URL(request.url);
  const isLoginPage = url.pathname === '/admin/login' || url.pathname === '/admin/login/';
  const isAdminRoute = url.pathname.startsWith('/admin') && !isLoginPage;

  console.log(`[Middleware] Rota: ${url.pathname}, isAdminRoute: ${isAdminRoute}, isLoginPage: ${isLoginPage}`);

  // Obter token uma única vez usando a API de cookies do Astro
  const accessToken = getAccessToken(request, cookies);

  // Verificar autenticação se houver token
  let user = null;
  if (accessToken) {
    const result = await verifyToken(accessToken);
    user = result.user;
  }

  // Proteger rotas administrativas
  if (isAdminRoute) {
    if (!user) {
      console.log('[Middleware] Rota admin sem autenticação, redirecionando para /admin/login');
      return redirect('/admin/login');
    }
    // Adicionar usuário aos locals para uso nas páginas
    locals.user = user;
    console.log('[Middleware] Acesso permitido à rota admin');
  }

  // Redirecionar se já autenticado e tentar acessar login
  if (isLoginPage && user) {
    console.log('[Middleware] Usuário autenticado tentando acessar login, redirecionando para /admin/dashboard');
    return redirect('/admin/dashboard');
  }

  return next();
});