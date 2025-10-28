// src/lib/catalog/performance/metrics.ts
// Web Vitals e métricas de performance

interface Metric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export class PerformanceMetrics {
  private metrics: Map<string, Metric> = new Map();
  private webVitalsEnabled: boolean = false;

  recordMetric(name: string, value: number): void {
    const rating = this.getRating(name, value);
    this.metrics.set(name, { name, value, rating });
    
    if (import.meta.env.DEV) {
      console.log(`[Metric] ${name}: ${value.toFixed(2)}ms (${rating})`);
    }
  }

  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<string, [number, number]> = {
      LCP: [2500, 4000],
      FID: [100, 300],
      CLS: [0.1, 0.25],
      FCP: [1800, 3000],
      TTFB: [800, 1800],
    };

    const [good, needsImprovement] = thresholds[name] || [1000, 3000];
    
    if (value <= good) return 'good';
    if (value <= needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  getMetrics(): Metric[] {
    return Array.from(this.metrics.values());
  }

  enableWebVitals(): void {
    if (this.webVitalsEnabled || typeof window === 'undefined') return;
    this.webVitalsEnabled = true;

    // Largest Contentful Paint (LCP)
    this.observeLCP();

    // First Input Delay (FID)
    this.observeFID();

    // Cumulative Layout Shift (CLS)
    this.observeCLS();

    // First Contentful Paint (FCP)
    this.observeFCP();

    // Time to First Byte (TTFB)
    this.observeTTFB();
  }

  private observeLCP(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.recordMetric('LCP', lastEntry.renderTime || lastEntry.loadTime);
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      console.warn('LCP observation failed:', e);
    }
  }

  private observeFID(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.recordMetric('FID', entry.processingStart - entry.startTime);
        });
      });

      observer.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      console.warn('FID observation failed:', e);
    }
  }

  private observeCLS(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.recordMetric('CLS', clsValue * 1000); // Convert to ms scale
          }
        });
      });

      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.warn('CLS observation failed:', e);
    }
  }

  private observeFCP(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric('FCP', entry.startTime);
          }
        });
      });

      observer.observe({ type: 'paint', buffered: true });
    } catch (e) {
      console.warn('FCP observation failed:', e);
    }
  }

  private observeTTFB(): void {
    try {
      const navigationTiming = performance.getEntriesByType('navigation')[0] as any;
      if (navigationTiming) {
        const ttfb = navigationTiming.responseStart - navigationTiming.requestStart;
        this.recordMetric('TTFB', ttfb);
      }
    } catch (e) {
      console.warn('TTFB observation failed:', e);
    }
  }

  disableWebVitals(): void {
    this.webVitalsEnabled = false;
  }

  reportToAnalytics(): void {
    const metrics = this.getMetrics();
    
    if (import.meta.env.PROD && metrics.length > 0) {
      // Aqui você pode enviar para Google Analytics, Vercel Analytics, etc
      console.log('[Web Vitals Report]', metrics);
      
      // Exemplo para Google Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        metrics.forEach((metric) => {
          (window as any).gtag('event', metric.name, {
            value: Math.round(metric.value),
            metric_rating: metric.rating,
            event_category: 'Web Vitals',
          });
        });
      }
    }
  }
}

export const metrics = new PerformanceMetrics();
