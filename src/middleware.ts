// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';
import { supabase } from './lib/supabase';

export const onRequest = defineMiddleware(async ({ request, locals, redirect }, next) => {
  const url = new URL(request.url);
  
  // Verificar se é uma rota administrativa (exceto login)
  const isAdminRoute = url.pathname.startsWith('/admin') && !url.pathname.startsWith('/admin/login');
  
  if (isAdminRoute) {
    // Tentar obter o token do cookie ou header
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');
    
    let accessToken: string | null = null;
    
    // Extrair token do Authorization header
    if (authHeader?.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
    }
    
    // Extrair token dos cookies (Supabase usa sb-access-token ou similar)
    if (!accessToken && cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split(';').map(cookie => {
          const [key, value] = cookie.trim().split('=');
          return [key, value];
        })
      );
      
      // Procurar por tokens do Supabase
      accessToken = cookies['sb-access-token'] || 
                    cookies['sb-auth-token'] ||
                    null;
    }
    
    if (accessToken) {
      try {
        // Verificar se o token é válido
        const { data: { user }, error } = await supabase.auth.getUser(accessToken);
        
        if (error || !user) {
          // Token inválido, redirecionar para login
          return redirect('/admin/login');
        }
        
        // Token válido, adicionar usuário aos locals
        locals.user = user;
      } catch (error) {
        console.error('Erro ao verificar token:', error);
        return redirect('/admin/login');
      }
    } else {
      // Sem token, redirecionar para login
      return redirect('/admin/login');
    }
  }
  
  // Se for a página de login e já estiver autenticado, redirecionar para dashboard
  if (url.pathname === '/admin/login' || url.pathname === '/admin/login/') {
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');
    
    let accessToken: string | null = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
    }
    
    if (!accessToken && cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split(';').map(cookie => {
          const [key, value] = cookie.trim().split('=');
          return [key, value];
        })
      );
      
      accessToken = cookies['sb-access-token'] || 
                    cookies['sb-auth-token'] ||
                    null;
    }
    
    if (accessToken) {
      try {
        const { data: { user }, error } = await supabase.auth.getUser(accessToken);
        
        if (!error && user) {
          // Já está autenticado, redirecionar para dashboard
          return redirect('/admin/dashboard');
        }
      } catch (error) {
        // Ignorar erro e deixar continuar para a página de login
      }
    }
  }
  
  return next();
});