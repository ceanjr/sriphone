// src/lib/catalog/performance/imageLoader.ts
// Lazy loading de imagens com IntersectionObserver

export class ImageLoader {
  private observer: IntersectionObserver | null = null;

  constructor() {
    if (typeof window === 'undefined') return;
    
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadImage(img);
            this.observer?.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    );
  }

  private loadImage(img: HTMLImageElement): void {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;
    
    if (src) {
      img.src = src;
      delete img.dataset.src;
    }
    
    if (srcset) {
      img.srcset = srcset;
      delete img.dataset.srcset;
    }

    img.classList.add('loaded');
  }

  observe(element: HTMLElement): void {
    if (!this.observer) return;
    
    const images = element.querySelectorAll('img[data-src]');
    images.forEach((img) => this.observer?.observe(img));
  }

  disconnect(): void {
    this.observer?.disconnect();
  }
}

export const imageLoader = new ImageLoader();
