import type { AstroCookies } from 'astro';
import { supabase } from './supabase';
import { createClient } from '@supabase/supabase-js';

/**
 * Verifica se o usuário está autenticado e refresh o token se necessário
 */
export async function verifyAuth(cookies: AstroCookies, authHeader?: string | null): Promise<boolean> {
  console.log('[verifyAuth] 🔍 Iniciando verificação de autenticação...');

  // Tentar pegar o token do header Authorization primeiro
  let accessToken = authHeader?.replace('Bearer ', '');

  // Se não tem no header, tentar nos cookies
  if (!accessToken) {
    accessToken = cookies.get('sb-access-token')?.value;
    if (accessToken) {
      console.log('[verifyAuth] 🍪 Access token encontrado nos cookies');
    }
  } else {
    console.log('[verifyAuth] 📋 Access token encontrado no header Authorization');
  }

  if (!accessToken) {
    console.log('[verifyAuth] ❌ Nenhum access token encontrado');

    // Tentar refresh token como fallback
    const refreshToken = cookies.get('sb-refresh-token')?.value;
    if (refreshToken) {
      console.log('[verifyAuth] 🔄 Tentando refresh token...');
      return await refreshSession(cookies, refreshToken);
    }

    return false;
  }

  try {
    console.log('[verifyAuth] 🔐 Verificando token com Supabase...');

    // Adicionar timeout de 5 segundos
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Auth timeout')), 5000)
    );

    const authPromise = supabase.auth.getUser(accessToken);

    const { data: { user }, error } = await Promise.race([authPromise, timeoutPromise]);

    if (error) {
      console.log('[verifyAuth] ⚠️ Erro ao verificar token:', error.message);

      // Se o token expirou, tentar refresh
      if (error.message.includes('expired') || error.message.includes('invalid')) {
        console.log('[verifyAuth] 🔄 Token expirado, tentando refresh...');
        const refreshToken = cookies.get('sb-refresh-token')?.value;
        if (refreshToken) {
          return await refreshSession(cookies, refreshToken);
        }
      }

      return false;
    }

    if (user) {
      console.log('[verifyAuth] ✅ Usuário autenticado:', user.email);
      return true;
    }

    console.log('[verifyAuth] ⚠️ Token válido mas nenhum usuário retornado');
    return false;
  } catch (error: any) {
    console.log('[verifyAuth] ❌ Exceção:', error.message);

    // Tentar refresh token como último recurso
    const refreshToken = cookies.get('sb-refresh-token')?.value;
    if (refreshToken) {
      console.log('[verifyAuth] 🔄 Tentando refresh token após exceção...');
      return await refreshSession(cookies, refreshToken);
    }

    return false;
  }
}

/**
 * Refresh a sessão usando o refresh token
 */
async function refreshSession(cookies: AstroCookies, refreshToken: string): Promise<boolean> {
  try {
    console.log('[refreshSession] 🔄 Iniciando refresh da sessão...');

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      console.log('[refreshSession] ❌ Erro ao refresh:', error.message);
      // Limpar cookies inválidos
      cookies.delete('sb-access-token', { path: '/' });
      cookies.delete('sb-refresh-token', { path: '/' });
      cookies.delete('sb-expires-at', { path: '/' });
      return false;
    }

    if (!data.session) {
      console.log('[refreshSession] ❌ Nenhuma sessão retornada');
      return false;
    }

    console.log('[refreshSession] ✅ Sessão refreshed com sucesso');

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

    console.log('[refreshSession] 🍪 Cookies atualizados');
    return true;
  } catch (error: any) {
    console.log('[refreshSession] ❌ Exceção ao refresh:', error.message);
    return false;
  }
}

export function getAuthenticatedSupabaseClient(cookies: AstroCookies, authHeader?: string | null) {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or Anon Key is not set in environment variables.');
  }

  let token = authHeader?.replace('Bearer ', '');

  if (!token) {
    token = cookies.get('sb-access-token')?.value;
  }

  if (!token) {
    throw new Error('No authentication token found');
  }

  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

export async function login(email: string, password: string) {
  console.log('[auth.login] 🔐 Fazendo login com Supabase...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.log('[auth.login] ❌ Erro:', error.message);
    throw error;
  }

  console.log('[auth.login] ✅ Login bem-sucedido');
  return data;
}

export async function logout() {
  console.log('[auth.logout] 🚪 Fazendo logout...');
  await supabase.auth.signOut();
  console.log('[auth.logout] ✅ Logout concluído');
}

export async function checkAuth(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch {
    return false;
  }
}
