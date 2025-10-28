// src/lib/catalog/core/config.ts
// Configurações do catálogo

export const CATALOG_CONFIG = {
  pagination: {
    itemsPerPage: 30,
    prefetchThreshold: 5,
  },
  
  search: {
    debounceMs: 300,
    minChars: 2,
  },
  
  images: {
    widths: [400, 600, 800],
    defaultWidth: 400,
    quality: 80,
    format: 'webp',
  },
  
  cache: {
    ttl: 10 * 60 * 1000,
    key: 'catalog_cache',
  },
  
  breakpoints: {
    mobile: 768,
    tablet: 1024,
  },
  
  performance: {
    enableWebVitals: true,
  },
} as const;

export const CATEGORY_ORDER = [
  'iPhone 11',
  'iPhone 12',
  'iPhone 13',
  'iPhone 14',
  'iPhone 15',
  'iPhone 16',
  'iPhone Novos',
  'iPhone ASIS',
  'JBL',
] as const;
