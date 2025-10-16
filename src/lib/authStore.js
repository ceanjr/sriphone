// src/lib/authStore.js
// Sistema simples de autenticação (em produção, use um backend real)

const AUTH_KEY = 'sr_iphone_auth';
const ADMIN_CREDENTIALS = {
  email: 'admin@sriphone.com',
  password: 'admin123' // Em produção, use hash e backend
};

export const authStore = {
  isAuthenticated() {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(AUTH_KEY) === 'true';
  },

  login(email, password) {
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      localStorage.setItem(AUTH_KEY, 'true');
      return true;
    }
    return false;
  },

  logout() {
    localStorage.removeItem(AUTH_KEY);
  }
};