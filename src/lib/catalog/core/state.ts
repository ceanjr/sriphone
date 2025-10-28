// src/lib/catalog/core/state.ts
// Gerenciamento de estado do catálogo

import type { CatalogState } from '../business';

let catalogState: CatalogState | null = null;

export function initState(initialData: Partial<CatalogState>): CatalogState {
  catalogState = {
    produtos: initialData.produtos || [],
    categorias: initialData.categorias || [],
    nextCursor: initialData.nextCursor || null,
    categoriaAtiva: 'todos',
    modoVisualizacao: window.innerWidth < 768 ? 'coluna' : 'grade',
    filtros: {
      busca: '',
      condicao: '',
      bateria: 0,
      ordenacao: 'recente',
    },
    paginacao: {
      itensPorPagina: 30,
      paginaAtual: 1,
      totalPaginas: 1,
      carregando: false,
      hasMore: true,
    },
  };
  return catalogState;
}

export function getState(): CatalogState {
  if (!catalogState) throw new Error('State not initialized');
  return catalogState;
}

export function updateState(updates: Partial<CatalogState>): CatalogState {
  if (!catalogState) throw new Error('State not initialized');
  catalogState = { ...catalogState, ...updates };
  return catalogState;
}

export function updateFiltros(filtros: Partial<CatalogState['filtros']>): CatalogState {
  if (!catalogState) throw new Error('State not initialized');
  catalogState.filtros = { ...catalogState.filtros, ...filtros };
  return catalogState;
}
