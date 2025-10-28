// src/lib/catalog/utils.ts
// Utilitários para catálogo

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
