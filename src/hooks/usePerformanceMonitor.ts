/**
 * Performance Monitoring Hook
 * 
 * Tracks component render performance using React Profiler API
 * Provides metrics for render count, duration, and optimization insights
 * 
 * @example
 * ```tsx
 * const ComponentWithProfiling = withPerformanceMonitor(
 *   HeavyComponent,
 *   'HeavyComponent',
 *   { logToConsole: true }
 * );
 * ```
 */

import React, { Profiler, ProfilerOnRenderCallback, ComponentType } from 'react';

interface PerformanceMetrics {
  componentName: string;
  renderCount: number;
  totalDuration: number;
  averageDuration: number;
  lastRenderDuration: number;
  lastRenderTimestamp: number;
}

interface PerformanceMonitorOptions {
  logToConsole?: boolean;
  warningThreshold?: number; // milliseconds
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private options: PerformanceMonitorOptions;

  constructor(options: PerformanceMonitorOptions = {}) {
    this.options = {
      logToConsole: false,
      warningThreshold: 16, // 60fps = 16ms per frame
      ...options,
    };
  }

  /**
   * Callback for React Profiler onRender
   * Records render metrics and logs performance warnings
   */
  onRender: ProfilerOnRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
  ) => {
    const existing = this.metrics.get(id);
    const renderCount = existing ? existing.renderCount + 1 : 1;
    const totalDuration = existing ? existing.totalDuration + actualDuration : actualDuration;

    const metrics: PerformanceMetrics = {
      componentName: id,
      renderCount,
      totalDuration,
      averageDuration: totalDuration / renderCount,
      lastRenderDuration: actualDuration,
      lastRenderTimestamp: commitTime,
    };

    this.metrics.set(id, metrics);

    // Log warnings for slow renders
    if (this.options.logToConsole) {
      if (actualDuration > (this.options.warningThreshold || 16)) {
        console.warn(
          `⚠️ Slow render detected in ${id} (${phase}):`,
          `${actualDuration.toFixed(2)}ms`,
          `\nAverage: ${metrics.averageDuration.toFixed(2)}ms`,
          `\nRender count: ${renderCount}`
        );
      } else {
        console.log(
          `✓ ${id} rendered in ${actualDuration.toFixed(2)}ms (${phase})`,
          `\nAverage: ${metrics.averageDuration.toFixed(2)}ms`
        );
      }
    }
  };

  /**
   * Get performance metrics for a specific component
   */
  getMetrics(componentName: string): PerformanceMetrics | undefined {
    return this.metrics.get(componentName);
  }

  /**
   * Get all performance metrics
   */
  getAllMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get components that exceeded the warning threshold
   */
  getSlowComponents(): PerformanceMetrics[] {
    return this.getAllMetrics().filter(
      (m) => m.averageDuration > (this.options.warningThreshold || 16)
    );
  }

  /**
   * Reset metrics for a specific component or all components
   */
  resetMetrics(componentName?: string): void {
    if (componentName) {
      this.metrics.delete(componentName);
    } else {
      this.metrics.clear();
    }
  }

  /**
   * Generate a performance report
   */
  generateReport(): string {
    const metrics = this.getAllMetrics();
    if (metrics.length === 0) {
      return 'No performance data collected yet.';
    }

    const sorted = metrics.sort((a, b) => b.averageDuration - a.averageDuration);
    
    let report = '\n=== Performance Report ===\n\n';
    sorted.forEach((m) => {
      const status = m.averageDuration > (this.options.warningThreshold || 16) ? '⚠️' : '✓';
      report += `${status} ${m.componentName}\n`;
      report += `   Renders: ${m.renderCount}\n`;
      report += `   Average: ${m.averageDuration.toFixed(2)}ms\n`;
      report += `   Total: ${m.totalDuration.toFixed(2)}ms\n`;
      report += `   Last: ${m.lastRenderDuration.toFixed(2)}ms\n\n`;
    });

    return report;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor({
  logToConsole: process.env.NODE_ENV === 'development',
  warningThreshold: 16,
});

/**
 * Higher-order component to wrap components with performance profiling
 * 
 * @param Component - Component to profile
 * @param componentName - Name for profiling identification
 * @returns Profiled component
 */
export function withPerformanceMonitor<P extends object>(
  Component: ComponentType<P>,
  componentName: string
): ComponentType<P> {
  return function ProfiledComponent(props: P) {
    return React.createElement(
      Profiler,
      { id: componentName, onRender: performanceMonitor.onRender },
      React.createElement(Component, props)
    );
  };
}

/**
 * Hook to access performance metrics in components
 */
export function usePerformanceMonitor() {
  return {
    getMetrics: (name: string) => performanceMonitor.getMetrics(name),
    getAllMetrics: () => performanceMonitor.getAllMetrics(),
    getSlowComponents: () => performanceMonitor.getSlowComponents(),
    generateReport: () => performanceMonitor.generateReport(),
    resetMetrics: (name?: string) => performanceMonitor.resetMetrics(name),
  };
}
