// src/lib/catalog/services/api.ts
// Serviços de API para catálogo

import { CATALOG_CONFIG } from '../core/config';

export const catalogApi = {
  async getProdutos(cursor?: string, limit: number = CATALOG_CONFIG.pagination.itemsPerPage) {
    try {
      const params = new URLSearchParams();
      if (cursor) params.set('cursor', cursor);
      params.set('limit', limit.toString());
      
      const response = await fetch(`/api/produtos?${params}`);
      if (!response.ok) throw new Error('Erro ao carregar produtos');
      
      return await response.json();
    } catch (error: any) {
      console.error('API error:', error);
      throw error;
    }
  }
};
