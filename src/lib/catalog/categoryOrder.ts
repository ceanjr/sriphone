// src/lib/catalog/categoryOrder.ts
// Ordem canônica de categorias de iPhones

export interface Category {
  id: string;
  nome: string;
  created_at?: string;
}

// Mapa de ordem de categorias (ordem de lançamento dos iPhones)
const CATEGORY_ORDER: { [key: string]: number } = {
  'todos': 0,
  'iphone 4': 1,
  'iphone 4s': 2,
  'iphone 5': 3,
  'iphone 5c': 4,
  'iphone 5s': 5,
  'iphone 6': 6,
  'iphone 6 plus': 7,
  'iphone 6s': 8,
  'iphone 6s plus': 9,
  'iphone 7': 10,
  'iphone 7 plus': 11,
  'iphone 8': 12,
  'iphone 8 plus': 13,
  'iphone x': 14,
  'iphone xr': 15,
  'iphone xs': 16,
  'iphone xs max': 17,
  'iphone 11': 18,
  'iphone 11 pro': 19,
  'iphone 11 pro max': 20,
  'iphone se': 21,
  'iphone se 2': 22,
  'iphone se 3': 23,
  'iphone 12': 24,
  'iphone 12 mini': 25,
  'iphone 12 pro': 26,
  'iphone 12 pro max': 27,
  'iphone 13': 28,
  'iphone 13 mini': 29,
  'iphone 13 pro': 30,
  'iphone 13 pro max': 31,
  'iphone 14': 32,
  'iphone 14 plus': 33,
  'iphone 14 pro': 34,
  'iphone 14 pro max': 35,
  'iphone 15': 36,
  'iphone 15 plus': 37,
  'iphone 15 pro': 38,
  'iphone 15 pro max': 39,
  'iphone 16': 40,
  'iphone 16 plus': 41,
  'iphone 16 pro': 42,
  'iphone 16 pro max': 43,
  'iphone 17': 44,
  'iphone 17 air': 45,
  'iphone 17 pro': 46,
  'iphone 17 pro max': 47,
};

/**
 * Ordena categorias pela ordem de lançamento dos iPhones
 * Categorias não reconhecidas aparecem no final (ordem alfabética)
 */
export function ordenarCategorias(categorias: Category[]): Category[] {
  return [...categorias].sort((a, b) => {
    const nomeA = a.nome.toLowerCase().trim();
    const nomeB = b.nome.toLowerCase().trim();
    const ordemA = CATEGORY_ORDER[nomeA];
    const ordemB = CATEGORY_ORDER[nomeB];

    // Ambas têm ordem definida
    if (ordemA !== undefined && ordemB !== undefined) {
      return ordemA - ordemB;
    }

    // Apenas A tem ordem (A vem primeiro)
    if (ordemA !== undefined) return -1;

    // Apenas B tem ordem (B vem primeiro)
    if (ordemB !== undefined) return 1;

    // Nenhuma tem ordem - ordenar alfabeticamente
    return nomeA.localeCompare(nomeB, 'pt-BR');
  });
}

/**
 * Obtém a posição de uma categoria na ordem
 * Retorna -1 se não estiver na ordem definida
 */
export function getCategoryOrder(categoryName: string): number {
  const nome = categoryName.toLowerCase().trim();
  return CATEGORY_ORDER[nome] ?? -1;
}
