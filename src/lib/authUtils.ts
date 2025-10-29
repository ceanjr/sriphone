// src/lib/authUtils.ts

/**
 * Utilitários para gerenciar autenticação no client-side
 */

// Nome da chave usada pelo Supabase para armazenar a sessão
const SUPABASE_AUTH_KEY = 'sb-auth-token';

/**
 * Salva o token de acesso no localStorage
 */
export function saveAuthToken(accessToken: string, refreshToken?: string) {
  if (typeof window === 'undefined') return;
  
  try {
    const authData = {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 dias
    };
    
    localStorage.setItem(SUPABASE_AUTH_KEY, JSON.stringify(authData));
  } catch (error) {
    console.error('Erro ao salvar token:', error);
  }
}

/**
 * Obtém o token de acesso do localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const authDataStr = localStorage.getItem(SUPABASE_AUTH_KEY);
    if (!authDataStr) return null;
    
    const authData = JSON.parse(authDataStr);
    
    // Verificar se o token expirou
    if (authData.expires_at && Date.now() > authData.expires_at) {
      clearAuthToken();
      return null;
    }
    
    return authData.access_token || null;
  } catch (error) {
    console.error('Erro ao obter token:', error);
    return null;
  }
}

/**
 * Remove o token de autenticação
 */
export function clearAuthToken() {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(SUPABASE_AUTH_KEY);
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('sb-auth-time');
  } catch (error) {
    console.error('Erro ao limpar token:', error);
  }
}

/**
 * Verifica se existe um token válido
 */
export function hasValidToken(): boolean {
  const token = getAuthToken();
  return token !== null;
}

/**
 * Adiciona o token de autenticação aos headers de uma requisição
 */
export function addAuthHeader(headers: HeadersInit = {}): HeadersInit {
  const token = getAuthToken();
  
  if (token) {
    return {
      ...headers,
      'Authorization': `Bearer ${token}`
    };
  }
  
  return headers;
}

/**
 * Faz uma requisição autenticada
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const headers = addAuthHeader(options.headers);
  
  return fetch(url, {
    ...options,
    headers
  });
}

/**
 * Redireciona para login se não estiver autenticado
 */
export function requireAuth(redirectPath: string = '/admin/login') {
  if (typeof window === 'undefined') return;
  
  if (!hasValidToken()) {
    window.location.href = redirectPath;
  }
}

/**
 * Redireciona para dashboard se já estiver autenticado
 */
export function redirectIfAuthenticated(redirectPath: string = '/admin/dashboard') {
  if (typeof window === 'undefined') return;
  
  if (hasValidToken()) {
    window.location.href = redirectPath;
  }
}