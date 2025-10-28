// src/scripts/catalog/init.ts
// Orquestrador principal do catálogo

import { initState, getState } from '../../lib/catalog/core/state';
import { renderer } from '../../lib/catalog/render/renderer';
import { createHandlers } from '../../lib/catalog/ui/handlers';
import { catalogEvents, onEvent } from '../../lib/catalog/ui/events';
import { filtrarProdutos, ordenarProdutos } from '../../lib/catalog/logic';
import { imageLoader } from '../../lib/catalog/performance/imageLoader';
import { metrics } from '../../lib/catalog/performance/metrics';

export function initializeCatalog(initialData: any) {
  const startTime = performance.now();

  const state = initState(initialData);

  const elementos = {
    produtosContainer: document.getElementById('produtos-container'),
    emptyState: document.getElementById('empty-state'),
    loading: document.getElementById('loading'),
    searchInput: document.getElementById('search-input') as HTMLInputElement,
    categoriaSelect: document.getElementById('categoria-select') as HTMLSelectElement,
    categoriasLista: document.getElementById('categorias-lista'),
  };

  const handlers = createHandlers(elementos);

  if (elementos.searchInput) {
    elementos.searchInput.addEventListener('input', handlers.searchInput);
  }

  onEvent(catalogEvents.FILTROS_CHANGED, () => {
    const state = getState();
    let produtosFiltrados = filtrarProdutos(state);
    produtosFiltrados = ordenarProdutos(produtosFiltrados, state.filtros.ordenacao);

    if (elementos.produtosContainer) {
      renderer.renderProdutos(
        elementos.produtosContainer,
        produtosFiltrados,
        state.categoriaAtiva,
        state.categorias
      );
      imageLoader.observe(elementos.produtosContainer);
    }
  });

  // Renderização inicial
  const loadTime = performance.now() - startTime;
  metrics.recordMetric('CatalogInit', loadTime);

  return { state: getState };
}
