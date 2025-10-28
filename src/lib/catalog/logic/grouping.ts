// src/lib/catalog/logic/grouping.ts
// Lógica de agrupamento de produtos

import type { Product } from './filters';

export function agruparPorCategoria(produtos: Product[]): Map<string, Product[]> {
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
