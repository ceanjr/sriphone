// src/lib/catalog/utils.ts
// Utilitários para catálogo

type ImageVariant = {
  thumbnail: string;
  medium: string;
  large: string;
};

type ImageFormat = string | ImageVariant;

export const utils = {
  formatarPreco(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  },

  calcularLarguraBateria(bateria: number): number {
    return (bateria / 100) * 14;
  },

  escapeHtml(text: string): string {
    if (typeof document === 'undefined') return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
  
  // Nova função para pegar URL da imagem (compatível com formato antigo e novo)
  getImageUrl(
    imagens: ImageFormat[] | undefined,
    size: 'thumbnail' | 'medium' | 'large' = 'medium',
    index: number = 0
  ): string {
    if (!imagens || imagens.length === 0) return '/placeholder.jpg';
    
    const image = imagens[index];
    if (!image) return '/placeholder.jpg';
    
    // Se for string JSON, fazer parse
    if (typeof image === 'string') {
      // Tentar fazer parse se parecer JSON
      if (image.startsWith('{')) {
        try {
          const parsed = JSON.parse(image);
          return parsed[size] || parsed.medium || parsed.thumbnail || '/placeholder.jpg';
        } catch {
          // Se falhar o parse, assumir que é URL direta (formato antigo)
          return image;
        }
      }
      // String simples (URL direta - formato antigo)
      return image;
    }
    
    // Formato objeto direto
    if (typeof image === 'object' && image !== null && 'thumbnail' in image) {
      return image[size] || image.medium || image.thumbnail || '/placeholder.jpg';
    }
    
    return '/placeholder.jpg';
  },
  
  optimizeImage(url: string, width: number = 400, quality: number = 80): string {
    if (!url || !url.includes('supabase.co')) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${width}&quality=${quality}&format=webp`;
  },
  
  generateSrcSet(url: string, widths: number[] = [400, 600, 800]): string {
    if (!url || !url.includes('supabase.co')) return '';
    return widths.map(w => `${this.optimizeImage(url, w)} ${w}w`).join(', ');
  }
};

export function getBateriaColor(bateria: number): string {
  if (bateria >= 80) return 'bateria-verde';
  return 'bateria-vermelho';
}
