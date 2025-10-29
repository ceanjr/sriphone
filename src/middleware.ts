// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';
import { supabase } from './lib/supabase';

/**
 * Extrai o access token do request (cookies ou header Authorization)
 */
function getAccessToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie');

  // Extrair token do Authorization header
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Extrair token dos cookies
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(cookie => {
        const [key, value] = cookie.trim().split('=');
        return [key, value];
      })
    );

    return cookies['sb-access-token'] || cookies['sb-auth-token'] || null;
  }

  return null;
}

/**
 * Verifica se o token é válido e retorna o usuário
 */
async function verifyToken(accessToken: string) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    return { user: error || !user ? null : user, error };
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return { user: null, error };
  }
}

export const onRequest = defineMiddleware(async ({ request, locals, redirect }, next) => {
  const url = new URL(request.url);
  const isLoginPage = url.pathname === '/admin/login' || url.pathname === '/admin/login/';
  const isAdminRoute = url.pathname.startsWith('/admin') && !isLoginPage;

  // Obter token uma única vez
  const accessToken = getAccessToken(request);

  // Verificar autenticação se houver token
  let user = null;
  if (accessToken) {
    const result = await verifyToken(accessToken);
    user = result.user;
  }

  // Proteger rotas administrativas
  if (isAdminRoute) {
    if (!user) {
      return redirect('/admin/login');
    }
    // Adicionar usuário aos locals para uso nas páginas
    locals.user = user;
  }

  // Redirecionar se já autenticado e tentar acessar login
  if (isLoginPage && user) {
    return redirect('/admin/dashboard');
  }

  return next();
});