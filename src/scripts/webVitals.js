// src/scripts/webVitals.js
// Web Vitals tracking para medir performance real

class WebVitalsTracker {
  constructor() {
    this.vitals = {};
    this.init();
  }

  init() {
    // Só executa em produção
    if (import.meta.env.DEV) return;

    this.trackCLS();
    this.trackFID();
    this.trackFCP();
    this.trackLCP();
    this.trackTTFB();
    
    // Enviar dados após 5 segundos ou antes de sair
    setTimeout(() => this.sendVitals(), 5000);
    window.addEventListener('beforeunload', () => this.sendVitals());
  }

  trackCLS() {
    // Cumulative Layout Shift
    let cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          cls += entry.value;
        }
      }
      this.vitals.CLS = cls;
    }).observe({ entryTypes: ['layout-shift'] });
  }

  trackFID() {
    // First Input Delay
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.vitals.FID = entry.processingStart - entry.startTime;
        break; // Apenas primeira interação
      }
    }).observe({ entryTypes: ['first-input'] });
  }

  trackFCP() {
    // First Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.vitals.FCP = entry.startTime;
          break;
        }
      }
    }).observe({ entryTypes: ['paint'] });
  }

  trackLCP() {
    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.vitals.LCP = entry.startTime;
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });
  }

  trackTTFB() {
    // Time to First Byte
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      this.vitals.TTFB = navigation.responseStart - navigation.requestStart;
    }
  }

  sendVitals() {
    if (Object.keys(this.vitals).length === 0) return;

    // Log no console (desenvolvimento)
    console.group('🚀 Web Vitals Performance');
    console.log('CLS (Cumulative Layout Shift):', this.vitals.CLS?.toFixed(3) || 'N/A');
    console.log('FID (First Input Delay):', this.vitals.FID?.toFixed(0) + 'ms' || 'N/A');
    console.log('FCP (First Contentful Paint):', this.vitals.FCP?.toFixed(0) + 'ms' || 'N/A');
    console.log('LCP (Largest Contentful Paint):', this.vitals.LCP?.toFixed(0) + 'ms' || 'N/A');
    console.log('TTFB (Time to First Byte):', this.vitals.TTFB?.toFixed(0) + 'ms' || 'N/A');
    console.groupEnd();

    // Opcional: Enviar para analytics (Google Analytics, Vercel, etc.)
    if (typeof gtag !== 'undefined') {
      Object.entries(this.vitals).forEach(([name, value]) => {
        gtag('event', name, {
          event_category: 'Web Vitals',
          value: Math.round(name === 'CLS' ? value * 1000 : value),
          non_interaction: true,
        });
      });
    }

    // Opcional: Enviar para Vercel Analytics
    if (typeof window.va !== 'undefined') {
      window.va('track', 'WebVitals', this.vitals);
    }
  }

  // Método para acessar vitals via console
  getVitals() {
    return this.vitals;
  }
}

// Inicializar automaticamente
const tracker = new WebVitalsTracker();

// Expor globalmente para debug
window.webVitals = tracker;

export default WebVitalsTracker;