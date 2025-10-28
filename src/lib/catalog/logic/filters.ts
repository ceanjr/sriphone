// src/lib/catalog/logic/filters.ts
// Lógica de filtros de produtos

export interface Product {
  id: string;
  nome: string;
  preco: number;
  bateria: number;
  condicao: string;
  created_at: string;
  categoria?: { nome: string };
  categoria_id?: string;
  codigo?: string;
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

export function filtrarProdutos(state: CatalogState): Product[] {
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
}
