// src/lib/catalog/business.ts
// Lógica de negócio do catálogo

export interface Product {
  id: string;
  nome: string;
  preco: number;
  bateria: number;
  condicao: string;
  created_at: string;
  categoria?: { nome: string };
  [key: string]: any;
}

export interface FilterState {
  busca: string;
  condicao: string;
  bateria: number;
  ordenacao: string;
}

export interface CatalogState {
  produtos: Product[];
  categorias: any[];
  nextCursor: string | null;
  categoriaAtiva: string;
  modoVisualizacao: string;
  filtros: FilterState;
  paginacao: {
    itensPorPagina: number;
    paginaAtual: number;
    totalPaginas: number;
    carregando: boolean;
    hasMore: boolean;
  };
}

export const business = {
  filtrarProdutos(state: CatalogState): Product[] {
    let produtosFiltrados = [...state.produtos];

    // Filtro de categoria
    if (state.categoriaAtiva !== 'todos') {
      produtosFiltrados = produtosFiltrados.filter(
        (p) => p.categoria_id === state.categoriaAtiva
      );
    }

    // Filtro de busca
    if (state.filtros.busca) {
      const busca = state.filtros.busca.toLowerCase();
      produtosFiltrados = produtosFiltrados.filter(
        (p) =>
          p.nome.toLowerCase().includes(busca) ||
          p.codigo?.toLowerCase().includes(busca)
      );
    }

    // Filtro de condição
    if (state.filtros.condicao) {
      produtosFiltrados = produtosFiltrados.filter(
        (p) => p.condicao === state.filtros.condicao
      );
    }

    // Filtro de bateria
    if (state.filtros.bateria > 0) {
      produtosFiltrados = produtosFiltrados.filter(
        (p) => p.bateria >= state.filtros.bateria
      );
    }

    return produtosFiltrados;
  },

  ordenarProdutos(produtos: Product[], ordenacao: string): Product[] {
    const copia = [...produtos];

    switch (ordenacao) {
      case 'preco-asc':
        return copia.sort((a, b) => a.preco - b.preco);
      case 'preco-desc':
        return copia.sort((a, b) => b.preco - a.preco);
      case 'bateria':
        return copia.sort((a, b) => b.bateria - a.bateria);
      default: // recente
        return copia.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );
    }
  },

  agruparPorCategoria(produtos: Product[]): Map<string, Product[]> {
    const grupos = new Map<string, Product[]>();
    produtos.forEach((produto) => {
      const nomeCategoria = produto.categoria?.nome || 'Sem Categoria';
      if (!grupos.has(nomeCategoria)) {
        grupos.set(nomeCategoria, []);
      }
      grupos.get(nomeCategoria)?.push(produto);
    });
    return grupos;
  }
};
