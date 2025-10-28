import type { AstroCookies } from 'astro';
import { supabase } from './supabase';
import { createClient } from '@supabase/supabase-js';

export async function verifyAuth(cookies: AstroCookies, authHeader?: string | null): Promise<boolean> {
  // Tentar pegar o token do header Authorization primeiro
  let token = authHeader?.replace('Bearer ', '');
  
  // Se não tem no header, tentar nos cookies
  if (!token) {
    token = cookies.get('sb-access-token')?.value;
  }
  
  if (!token) return false;

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    return !error && !!user;
  } catch {
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
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function logout() {
  await supabase.auth.signOut();
}

export async function checkAuth(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch {
    return false;
  }
}
