import { onCLS, onFCP, onINP, onLCP, onTTFB, Metric } from 'web-vitals';

export interface VitalsData {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

// Thresholds for Web Vitals (in milliseconds)
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  CLS: { good: 0.1, poor: 0.25 },   // Cumulative Layout Shift
  INP: { good: 200, poor: 500 },    // Interaction to Next Paint
  TTFB: { good: 800, poor: 1800 },  // Time to First Byte
};

// Send metrics to analytics endpoint
function sendToAnalytics(metric: Metric) {
  const data: VitalsData = {
    name: metric.name,
    value: Math.round(metric.value),
    rating: metric.rating || 'needs-improvement',
    delta: Math.round(metric.delta),
    id: metric.id,
    navigationType: metric.navigationType || 'unknown',
  };

  // Log to console in development
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${data.name}:`, data);
  }

  // Send to analytics endpoint
  if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
    fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch((error) => {
      console.error('Failed to send analytics:', error);
    });
  }

  // Store in localStorage for debugging
  try {
    const storedMetrics = JSON.parse(
      localStorage.getItem('webVitalsHistory') || '[]'
    );
    storedMetrics.push({
      ...data,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    });
    // Keep only last 50 measurements
    if (storedMetrics.length > 50) {
      storedMetrics.shift();
    }
    localStorage.setItem('webVitalsHistory', JSON.stringify(storedMetrics));
  } catch (e) {
    // Ignore localStorage errors
  }
}

// Initialize Web Vitals monitoring
export function initWebVitals() {
  // Core Web Vitals
  onLCP(sendToAnalytics);
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
  
  // Additional metrics
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}

// Get current performance metrics
export function getPerformanceMetrics() {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  if (!navigation) {
    return null;
  }

  return {
    // Navigation timing
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcp: navigation.connectEnd - navigation.connectStart,
    ssl: navigation.requestStart - navigation.secureConnectionStart,
    ttfb: navigation.responseStart - navigation.requestStart,
    download: navigation.responseEnd - navigation.responseStart,
    domInteractive: navigation.domInteractive - navigation.fetchStart,
    domComplete: navigation.domComplete - navigation.fetchStart,
    loadComplete: navigation.loadEventEnd - navigation.fetchStart,
    
    // Resource timing summary
    resources: performance.getEntriesByType('resource').map((entry: any) => ({
      name: entry.name,
      type: entry.initiatorType,
      duration: entry.duration,
      size: entry.transferSize || 0,
    })),
    
    // Memory usage (if available)
    memory: (performance as any).memory ? {
      used: (performance as any).memory.usedJSHeapSize,
      total: (performance as any).memory.totalJSHeapSize,
      limit: (performance as any).memory.jsHeapSizeLimit,
    } : null,
  };
}

// Performance observer for long tasks
export function observeLongTasks(callback: (duration: number) => void) {
  if ('PerformanceObserver' in window && 'PerformanceLongTaskTiming' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          callback(entry.duration);
        }
      }
    });
    
    try {
      observer.observe({ entryTypes: ['longtask'] });
      return () => observer.disconnect();
    } catch (e) {
      // Long task API not supported
    }
  }
  
  return () => {};
}

// Mark custom performance timing
export function markTiming(name: string) {
  if ('performance' in window && 'mark' in performance) {
    performance.mark(name);
  }
}

// Measure between two marks
export function measureTiming(name: string, startMark: string, endMark: string) {
  if ('performance' in window && 'measure' in performance) {
    try {
      performance.measure(name, startMark, endMark);
      const measures = performance.getEntriesByName(name);
      if (measures.length > 0) {
        return measures[measures.length - 1].duration;
      }
    } catch (e) {
      // Marks don't exist
    }
  }
  return null;
}