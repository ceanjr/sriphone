// src/lib/catalog/performance/metrics.ts
// Web Vitals e métricas de performance

interface Metric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export class PerformanceMetrics {
  private metrics: Map<string, Metric> = new Map();

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
}

export const metrics = new PerformanceMetrics();
