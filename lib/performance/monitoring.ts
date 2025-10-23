/**
 * Performance monitoring and optimization utilities
 * Provides tools for measuring and improving application performance
 */

import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';

// Performance metrics interface
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage?: number;
  timestamp: number;
}

// Performance monitor class
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers(): void {
    // Only initialize observers in browser environment
    if (typeof window === 'undefined') {
      return; // Skip initialization during SSR
    }

    // Observe navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.recordMetric({
                loadTime: entry.duration,
                renderTime: navEntry.loadEventEnd - navEntry.responseEnd,
                interactionTime: 0,
                timestamp: Date.now()
              });
            }
          });
        });
        
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);
      } catch (error) {
        console.warn('Navigation timing observer not supported:', error);
      }

      // Observe paint timing
      try {
        const paintObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            console.log(`${entry.name}: ${entry.startTime}ms`);
          });
        });
        
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);
      } catch (error) {
        console.warn('Paint timing observer not supported:', error);
      }
    }
  }

  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only the last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageMetrics(): Partial<PerformanceMetrics> {
    if (this.metrics.length === 0) return {};

    const sums = this.metrics.reduce(
      (acc, metric) => ({
        loadTime: acc.loadTime + metric.loadTime,
        renderTime: acc.renderTime + metric.renderTime,
        interactionTime: acc.interactionTime + metric.interactionTime,
        memoryUsage: acc.memoryUsage + (metric.memoryUsage || 0)
      }),
      { loadTime: 0, renderTime: 0, interactionTime: 0, memoryUsage: 0 }
    );

    const count = this.metrics.length;
    return {
      loadTime: sums.loadTime / count,
      renderTime: sums.renderTime / count,
      interactionTime: sums.interactionTime / count,
      memoryUsage: sums.memoryUsage / count
    };
  }

  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
  }
}

// Global performance monitor instance
let globalPerformanceMonitor: PerformanceMonitor | null = null;

export const getPerformanceMonitor = (): PerformanceMonitor => {
  if (!globalPerformanceMonitor) {
    globalPerformanceMonitor = new PerformanceMonitor();
  }
  return globalPerformanceMonitor;
};

// Performance measurement hook
export const usePerformanceMeasurement = (componentName: string) => {
  const startTimeRef = useRef<number | undefined>(undefined);
  const performanceMonitor = useMemo(() => getPerformanceMonitor(), []);

  useEffect(() => {
    startTimeRef.current = performance.now();
    
    return () => {
      if (startTimeRef.current) {
        const renderTime = performance.now() - startTimeRef.current;
        performanceMonitor.recordMetric({
          loadTime: 0,
          renderTime,
          interactionTime: 0,
          timestamp: Date.now()
        });
        
        console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
      }
    };
  }, [componentName, performanceMonitor]);

  const measureInteraction = useCallback((interactionName: string) => {
    const startTime = performance.now();
    
    return () => {
      const interactionTime = performance.now() - startTime;
      performanceMonitor.recordMetric({
        loadTime: 0,
        renderTime: 0,
        interactionTime,
        timestamp: Date.now()
      });
      
      console.log(`${componentName} ${interactionName} interaction time: ${interactionTime.toFixed(2)}ms`);
    };
  }, [componentName, performanceMonitor]);

  return { measureInteraction };
};

// Type for Chrome's non-standard memory API
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory;
}

// Memory usage monitoring
export const useMemoryMonitoring = (interval: number = 5000) => {
  const [memoryInfo, setMemoryInfo] = useState<PerformanceMemory | null>(null);

  useEffect(() => {
    const checkMemory = () => {
      const perf = performance as PerformanceWithMemory;
      if (perf.memory) {
        setMemoryInfo({
          usedJSHeapSize: perf.memory.usedJSHeapSize,
          totalJSHeapSize: perf.memory.totalJSHeapSize,
          jsHeapSizeLimit: perf.memory.jsHeapSizeLimit
        });
      }
    };

    checkMemory();
    const intervalId = setInterval(checkMemory, interval);

    return () => clearInterval(intervalId);
  }, [interval]);

  return memoryInfo;
};

// Bundle size monitoring
export const bundleAnalytics = {
  measureBundleSize: async (moduleName: string): Promise<number> => {
    if (typeof window === 'undefined') {
      return 0; // Skip during SSR
    }
    
    // Type for Network Information API (non-standard)
    interface NetworkInformation {
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
    }
    
    interface NavigatorWithConnection extends Navigator {
      connection?: NetworkInformation;
    }
    
    const nav = navigator as NavigatorWithConnection;
    if (nav.connection) {
      console.log(`Bundle ${moduleName} - Connection type: ${nav.connection.effectiveType}`);
    }
    
    // This would integrate with your build tools to get actual bundle sizes
    return 0;
  },

  reportLargeBundle: (moduleName: string, size: number): void => {
    if (size > 1024 * 1024) { // > 1MB
      console.warn(`Large bundle detected: ${moduleName} (${(size / 1024 / 1024).toFixed(2)}MB)`);
    }
  }
};

// Critical rendering path optimization
export const criticalRenderingPath = {
  measureLCP: (): Promise<number> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(0); // Return 0 during SSR
        return;
      }
      
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
          observer.disconnect();
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } else {
        resolve(0);
      }
    });
  },

  measureFID: (): Promise<number> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(0); // Return 0 during SSR
        return;
      }
      
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const fidEntry = entry as PerformanceEventTiming;
            resolve(fidEntry.processingStart - fidEntry.startTime);
          });
          observer.disconnect();
        });
        
        observer.observe({ entryTypes: ['first-input'] });
      } else {
        resolve(0);
      }
    });
  },

  measureCLS: (): Promise<number> => {
    return new Promise((resolve) => {
      let clsValue = 0;
      
      if (typeof window === 'undefined') {
        resolve(0); // Return 0 during SSR
        return;
      }
      
      // Type for Layout Shift entry
      interface LayoutShiftEntry extends PerformanceEntry {
        hadRecentInput: boolean;
        value: number;
      }
      
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const lsEntry = entry as LayoutShiftEntry;
            if (!lsEntry.hadRecentInput) {
              clsValue += lsEntry.value;
            }
          });
        });
        
        observer.observe({ entryTypes: ['layout-shift'] });
        
        // Resolve after 5 seconds
        setTimeout(() => {
          resolve(clsValue);
          observer.disconnect();
        }, 5000);
      } else {
        resolve(0);
      }
    });
  }
};

// Performance budget monitoring
export interface PerformanceBudget {
  maxLoadTime: number;
  maxRenderTime: number;
  maxInteractionTime: number;
  maxBundleSize: number;
}

export const defaultPerformanceBudget: PerformanceBudget = {
  maxLoadTime: 3000, // 3 seconds
  maxRenderTime: 100, // 100ms
  maxInteractionTime: 50, // 50ms
  maxBundleSize: 2 * 1024 * 1024 // 2MB
};

export const checkPerformanceBudget = (
  metrics: PerformanceMetrics,
  budget: PerformanceBudget = defaultPerformanceBudget
): { passed: boolean; violations: string[] } => {
  const violations: string[] = [];

  if (metrics.loadTime > budget.maxLoadTime) {
    violations.push(`Load time exceeded budget: ${metrics.loadTime}ms > ${budget.maxLoadTime}ms`);
  }

  if (metrics.renderTime > budget.maxRenderTime) {
    violations.push(`Render time exceeded budget: ${metrics.renderTime}ms > ${budget.maxRenderTime}ms`);
  }

  if (metrics.interactionTime > budget.maxInteractionTime) {
    violations.push(`Interaction time exceeded budget: ${metrics.interactionTime}ms > ${budget.maxInteractionTime}ms`);
  }

  return {
    passed: violations.length === 0,
    violations
  };
};

// Performance optimization recommendations
export const getPerformanceRecommendations = (metrics: PerformanceMetrics[]): string[] => {
  const recommendations: string[] = [];
  const avgMetrics = getPerformanceMonitor().getAverageMetrics();

  if (avgMetrics.loadTime && avgMetrics.loadTime > 2000) {
    recommendations.push('Consider code splitting and lazy loading to reduce initial bundle size');
  }

  if (avgMetrics.renderTime && avgMetrics.renderTime > 100) {
    recommendations.push('Optimize component rendering with React.memo and useMemo');
  }

  if (avgMetrics.interactionTime && avgMetrics.interactionTime > 50) {
    recommendations.push('Debounce user interactions and optimize event handlers');
  }

  if (avgMetrics.memoryUsage && avgMetrics.memoryUsage > 50 * 1024 * 1024) {
    recommendations.push('Review memory usage and clean up unused references');
  }

  return recommendations;
};

// React performance utilities
export const performanceUtils = {
  // Measure component render time
  withPerformanceMeasurement: <P extends object>(
    Component: React.ComponentType<P>,
    componentName: string
  ) => {
    const MemoizedComponent = React.memo<P>((props: P) => {
      usePerformanceMeasurement(componentName);
      
      return React.createElement(Component, props);
    });
    
    MemoizedComponent.displayName = `withPerformance(${componentName})`;
    
    return MemoizedComponent;
  },

  // Lazy load with performance tracking
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createLazyComponent: <T extends React.ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>,
    componentName: string
  ) => {
    return React.lazy(async () => {
      const startTime = performance.now();
      const result = await importFunc();
      const loadTime = performance.now() - startTime;
      
      console.log(`Lazy loaded ${componentName} in ${loadTime.toFixed(2)}ms`);
      
      return result;
    });
  }
};