// src/lib/catalog/render/renderer.ts
// Funções de renderização do catálogo

import { templates } from './templates';
import type { Product } from '../logic/filters';
import { business } from '../logic/filters';
import type { CatalogState } from '../logic/filters';

export const renderer = {
  renderProdutos(
    container: HTMLElement,
    produtos: Product[],
    categoriaAtiva: string,
    categorias: any[]
  ): void {
    if (!container) return;

    if (produtos.length === 0) {
      container.innerHTML = '';
      return;
    }

    if (categoriaAtiva === 'todos') {
      // Agrupar por categoria
      const grupos = business.agruparPorCategoria(produtos);
      
      // Ordenar categorias
      const categoriasOrdenadas = Array.from(grupos.keys())
        .map(nome => categorias.find(c => c.nome === nome))
        .filter(Boolean);

      container.innerHTML = categoriasOrdenadas
        .map(cat => {
          const prods = grupos.get(cat.nome);
          return prods ? templates.categoriaSecao(cat.nome, prods) : '';
        })
        .filter(html => html !== '')
        .join('');
    } else {
      // Renderizar produtos direto
      container.innerHTML = `
        <div class="categoria-grid">
          ${produtos.map(p => templates.produtoCard(p)).join('')}
        </div>
      `;
    }
  },

  renderCategorias(
    container: HTMLElement | null,
    selectElement: HTMLSelectElement | null,
    categorias: any[],
    categoriaAtiva: string
  ): void {
    if (!categorias || categorias.length === 0) return;

    const categoriasOrdenadas = [...categorias].sort((a, b) => {
      const order = [
        'iPhone 11', 'iPhone 12', 'iPhone 13', 'iPhone 14',
        'iPhone 15', 'iPhone 16', 'iPhone Novos', 'iPhone ASIS', 'JBL'
      ];
      const indexA = order.indexOf(a.nome);
      const indexB = order.indexOf(b.nome);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.nome.localeCompare(b.nome);
    });

    // Renderizar select mobile
    if (selectElement) {
      selectElement.innerHTML = `
        <option value="todos">Todas as Categorias</option>
        ${categoriasOrdenadas.map(cat => 
          `<option value="${cat.id}">${cat.nome}</option>`
        ).join('')}
      `;
      selectElement.value = categoriaAtiva;
    }

    // Renderizar botões desktop
    if (container) {
      container.innerHTML = categoriasOrdenadas.map(cat => `
        <button 
          class="categoria-btn ${cat.id === categoriaAtiva ? 'active' : ''}" 
          data-categoria="${cat.id}"
        >
          ${cat.nome}
        </button>
      `).join('');
    }
  },

  showLoading(container: HTMLElement | null, show: boolean): void {
    if (!container) return;
    container.style.display = show ? 'flex' : 'none';
  },

  showEmptyState(container: HTMLElement | null, show: boolean): void {
    if (!container) return;
    container.style.display = show ? 'block' : 'none';
  }
};
