// src/lib/imageOptimizer.ts
// Utilitários para otimização de imagens do Supabase

export interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
  resize?: 'cover' | 'contain' | 'fill';
}

/**
 * Otimiza URL de imagem do Supabase Storage com parâmetros de transformação
 * Supabase Storage suporta transformações via URL params
 */
export function optimizeSupabaseImage(
  url: string,
  options: ImageOptions = {}
): string {
  if (!url) return '';
  
  // Se não for URL do Supabase, retorna original
  if (!url.includes('supabase')) {
    return url;
  }

  const {
    width,
    height,
    quality = 80,
    format = 'webp',
    resize = 'cover'
  } = options;

  // Construir query params
  const params = new URLSearchParams();
  
  if (width) params.append('width', width.toString());
  if (height) params.append('height', height.toString());
  params.append('quality', quality.toString());
  params.append('format', format);
  params.append('resize', resize);

  // Adicionar params à URL
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${params.toString()}`;
}

/**
 * Gera srcset responsivo para imagens do Supabase
 */
export function generateResponsiveSrcSet(
  url: string,
  widths: number[] = [320, 640, 960, 1280, 1920]
): string {
  if (!url) return '';
  
  return widths
    .map(width => {
      const optimizedUrl = optimizeSupabaseImage(url, { width, quality: 80 });
      return `${optimizedUrl} ${width}w`;
    })
    .join(', ');
}

/**
 * Gera sizes attribute baseado em breakpoints
 */
export function generateSizes(
  type: 'product' | 'hero' | 'thumbnail' | 'full'
): string {
  const sizesMap = {
    product: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px',
    hero: '100vw',
    thumbnail: '(max-width: 640px) 80px, 120px',
    full: '(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 900px'
  };

  return sizesMap[type];
}

/**
 * Detecta se é mobile para carregar imagens menores
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768;
}

/**
 * Gera placeholder blur data URL
 */
export function getPlaceholderColor(index: number): string {
  const colors = [
    '#1a1a1a',
    '#0f0f0f',
    '#252525',
    '#1f1f1f',
  ];
  return colors[index % colors.length];
}

/**
 * Otimização específica para mobile
 */
export function getMobileOptimizedUrl(url: string): string {
  return optimizeSupabaseImage(url, {
    width: 600,
    quality: 75,
    format: 'webp',
    resize: 'cover'
  });
}

/**
 * Otimização específica para desktop
 */
export function getDesktopOptimizedUrl(url: string): string {
  return optimizeSupabaseImage(url, {
    width: 1200,
    quality: 85,
    format: 'webp',
    resize: 'cover'
  });
}

/**
 * Otimização para thumbnails
 */
export function getThumbnailUrl(url: string): string {
  return optimizeSupabaseImage(url, {
    width: 200,
    height: 200,
    quality: 70,
    format: 'webp',
    resize: 'cover'
  });
}
