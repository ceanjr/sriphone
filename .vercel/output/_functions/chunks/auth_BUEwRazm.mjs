import { s as supabase } from './supabase_uscxYbXR.mjs';

async function verifyAuth(cookies) {
  const token = cookies.get("sb-access-token")?.value;
  if (!token) return false;
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    return !error && !!user;
  } catch {
    return false;
  }
}
async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
}
async function logout() {
  await supabase.auth.signOut();
}

export { logout as a, login as l, verifyAuth as v };
