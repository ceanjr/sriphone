// src/utils/imageOptimizer.ts
// Utilitário para gerar srcset responsive

export interface ResponsiveImageConfig {
  src: string;
  alt: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  fetchpriority?: 'high' | 'low' | 'auto';
}

export function createResponsiveImage(config: ResponsiveImageConfig) {
  const { src, alt, sizes, loading = 'lazy', decoding = 'async', fetchpriority } = config;
  
  // Se não é uma URL do Supabase, retornar imagem normal
  if (!src.includes('supabase')) {
    return {
      src,
      alt,
      loading,
      decoding,
      fetchpriority
    };
  }

  // Extrair base URL e extensão
  const url = new URL(src);
  const pathParts = url.pathname.split('.');
  const extension = pathParts.pop();
  const basePath = pathParts.join('.');

  // Gerar diferentes tamanhos (Supabase tem transformações automáticas)
  const breakpoints = [400, 800, 1200, 1600];
  
  const srcset = breakpoints
    .map(width => {
      // Usar transformações do Supabase Storage
      const transformedUrl = new URL(src);
      transformedUrl.searchParams.set('width', width.toString());
      transformedUrl.searchParams.set('quality', '80');
      transformedUrl.searchParams.set('format', 'webp');
      
      return `${transformedUrl.toString()} ${width}w`;
    })
    .join(', ');

  // Default sizes se não especificado
  const defaultSizes = sizes || '(max-width: 768px) 400px, (max-width: 1200px) 800px, 1200px';

  return {
    src, // Fallback original
    srcset,
    sizes: defaultSizes,
    alt,
    loading,
    decoding,
    fetchpriority
  };
}

// Helper para imagens de produtos
export function createProductImage(src: string, alt: string, priority = false) {
  return createResponsiveImage({
    src,
    alt,
    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px',
    loading: priority ? 'eager' : 'lazy',
    fetchpriority: priority ? 'high' : 'auto',
    decoding: 'async'
  });
}

// Helper para imagem do hero
export function createHeroImage(src: string, alt: string) {
  return createResponsiveImage({
    src,
    alt,
    sizes: '100vw',
    loading: 'eager',
    fetchpriority: 'high',
    decoding: 'async'
  });
}