// src/lib/catalog/logic/sorting.ts
// Lógica de ordenação de produtos

import type { Product } from './filters';

export function ordenarProdutos(produtos: Product[], ordenacao: string): Product[] {
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
}
