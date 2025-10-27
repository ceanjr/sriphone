import type { AstroCookies } from 'astro';
import { supabase } from './supabase';

export async function verifyAuth(cookies: AstroCookies): Promise<boolean> {
  const token = cookies.get('sb-access-token')?.value;
  
  if (!token) return false;

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    return !error && !!user;
  } catch {
    return false;
  }
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
