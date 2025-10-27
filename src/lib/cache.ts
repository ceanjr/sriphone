// src/lib/cache.ts
// Sistema simples de cache em memória para otimizar queries repetidas

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em milissegundos
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>>;

  constructor() {
    this.cache = new Map();
  }

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // TTL padrão: 5 minutos
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  // Limpar entradas expiradas
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new SimpleCache();

// Limpar cache a cada 10 minutos
if (typeof window !== 'undefined') {
  setInterval(() => cache.cleanup(), 10 * 60 * 1000);
}
