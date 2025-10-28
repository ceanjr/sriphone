// src/lib/catalog/services/cache.ts
// Sistema de cache simples

import { CATALOG_CONFIG } from '../core/config';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export const cacheService = {
  set<T>(key: string, data: T): void {
    try {
      const entry: CacheEntry<T> = { data, timestamp: Date.now() };
      sessionStorage.setItem(key, JSON.stringify(entry));
    } catch (e) {
      console.warn('Cache write failed');
    }
  },

  get<T>(key: string): T | null {
    try {
      const item = sessionStorage.getItem(key);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      const age = Date.now() - entry.timestamp;

      if (age > CATALOG_CONFIG.cache.ttl) {
        this.delete(key);
        return null;
      }

      return entry.data;
    } catch (e) {
      return null;
    }
  },

  delete(key: string): void {
    sessionStorage.removeItem(key);
  }
};
