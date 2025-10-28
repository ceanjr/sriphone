// src/lib/catalog/ui/handlers.ts
// Handlers de eventos do catálogo

import { getState, updateState, updateFiltros } from '../core/state';
import { catalogEvents, emitEvent } from './events';
import { debounce } from '../../utils/debounce';
import { CATALOG_CONFIG } from '../core/config';

export function createHandlers(elementos: any) {
  const handleSearch = debounce((value: string) => {
    updateFiltros({ busca: value });
    emitEvent(catalogEvents.FILTROS_CHANGED);
  }, CATALOG_CONFIG.search.debounceMs);

  return {
    searchInput: (e: Event) => {
      const input = e.target as HTMLInputElement;
      handleSearch(input.value);
    },

    categoriaClick: (e: Event) => {
      const btn = e.currentTarget as HTMLElement;
      const categoriaId = btn.dataset.categoria || 'todos';
      
      updateState({ categoriaAtiva: categoriaId });
      emitEvent(catalogEvents.CATEGORIA_CHANGED, { categoriaId });
      
      document.querySelectorAll('.categoria-btn').forEach(b => {
        b.classList.toggle('active', b === btn);
      });
    },

    categoriaSelectChange: (e: Event) => {
      const select = e.target as HTMLSelectElement;
      updateState({ categoriaAtiva: select.value });
      emitEvent(catalogEvents.CATEGORIA_CHANGED, { categoriaId: select.value });
    },

    viewModeChange: (e: Event) => {
      const btn = e.currentTarget as HTMLElement;
      const mode = btn.dataset.view as 'grade' | 'lista' | 'coluna' || 'grade';
      
      updateState({ modoVisualizacao: mode as string });
      emitEvent(catalogEvents.VIEW_MODE_CHANGED, { mode });
      
      document.querySelectorAll('[data-view]').forEach(b => {
        b.classList.toggle('active', b === btn);
      });
    },

    condicaoChange: (e: Event) => {
      const select = e.target as HTMLSelectElement;
      updateFiltros({ condicao: select.value });
      emitEvent(catalogEvents.FILTROS_CHANGED);
    },

    bateriaChange: (e: Event) => {
      const input = e.target as HTMLInputElement;
      updateFiltros({ bateria: parseInt(input.value) || 0 });
      emitEvent(catalogEvents.FILTROS_CHANGED);
    },

    ordenacaoChange: (e: Event) => {
      const select = e.target as HTMLSelectElement;
      updateFiltros({ ordenacao: select.value });
      emitEvent(catalogEvents.FILTROS_CHANGED);
    },

    limparFiltros: (elementos: any) => {
      updateFiltros({
        busca: '',
        condicao: '',
        bateria: 0,
        ordenacao: 'recente',
      });
      
      if (elementos.searchInput) elementos.searchInput.value = '';
      if (elementos.condicaoSelect) elementos.condicaoSelect.value = '';
      if (elementos.bateriaSlider) elementos.bateriaSlider.value = '0';
      if (elementos.ordenacaoSelect) elementos.ordenacaoSelect.value = 'recente';
      
      emitEvent(catalogEvents.FILTROS_CHANGED);
    },

    toggleFiltros: (elementos: any) => {
      if (!elementos.filtrosAvancados) return;
      const isVisible = elementos.filtrosAvancados.style.display !== 'none';
      elementos.filtrosAvancados.style.display = isVisible ? 'none' : 'block';
    },
  };
}
