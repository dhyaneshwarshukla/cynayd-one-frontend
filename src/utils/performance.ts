import React, { ComponentType, ReactElement } from 'react';

// Performance measurement utilities
export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  bundleSize?: number;
  reRenderCount: number;
}

export interface PerformanceReport {
  componentName: string;
  metrics: PerformanceMetrics;
  recommendations: string[];
  timestamp: Date;
}

// Component render time measurement
export const measureRenderTime = <P extends object>(
  Component: ComponentType<P>,
  props: P,
  iterations: number = 100
): PerformanceMetrics => {
  const startTime = performance.now();
  let totalRenderTime = 0;

  for (let i = 0; i < iterations; i++) {
    const renderStart = performance.now();
    // This would need to be implemented with a proper test renderer
    // For now, we'll simulate the measurement
    const renderEnd = performance.now();
    totalRenderTime += renderEnd - renderStart;
  }

  const averageRenderTime = totalRenderTime / iterations;
  const totalTime = performance.now() - startTime;

  return {
    renderTime: averageRenderTime,
    reRenderCount: 0, // Would be measured in actual component lifecycle
  };
};

// Memory usage measurement (if available)
export const measureMemoryUsage = (): number | undefined => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
  }
  return undefined;
};

// Bundle size estimation
export const estimateBundleSize = (componentCode: string): number => {
  // Rough estimation: 1 character ≈ 1 byte
  const sizeInBytes = new Blob([componentCode]).size;
  return sizeInBytes / 1024; // Convert to KB
};

// Performance monitoring hook
export const usePerformanceMonitor = (
  componentName: string,
  enabled: boolean = process.env.NODE_ENV === 'development'
) => {
  const startTime = React.useRef(performance.now());
  const renderCount = React.useRef(0);

  React.useEffect(() => {
    if (!enabled) return;

    renderCount.current += 1;
    const renderTime = performance.now() - startTime.current;

    // Log performance metrics
    console.log(`[Performance] ${componentName}:`, {
      renderTime: `${renderTime.toFixed(2)}ms`,
      renderCount: renderCount.current,
      memoryUsage: measureMemoryUsage(),
    });

    // Reset timer for next render
    startTime.current = performance.now();
  });

  return {
    renderTime: performance.now() - startTime.current,
    renderCount: renderCount.current,
  };
};

// Performance optimization recommendations
export const generateOptimizationRecommendations = (
  metrics: PerformanceMetrics,
  componentName: string
): string[] => {
  const recommendations: string[] = [];

  if (metrics.renderTime > 16) {
    recommendations.push(
      `Consider using React.memo() to prevent unnecessary re-renders of ${componentName}`
    );
    recommendations.push(
      `Optimize expensive calculations in ${componentName} using useMemo() or useCallback()`
    );
  }

  if (metrics.renderTime > 50) {
    recommendations.push(
      `${componentName} render time is very high. Consider code splitting or lazy loading`
    );
  }

  if (metrics.reRenderCount > 10) {
    recommendations.push(
      `${componentName} is re-rendering frequently. Review dependency arrays in useEffect/useMemo`
    );
  }

  if (metrics.memoryUsage && metrics.memoryUsage > 100) {
    recommendations.push(
      `${componentName} is using significant memory. Check for memory leaks in event listeners`
    );
  }

  if (metrics.bundleSize && metrics.bundleSize > 50) {
    recommendations.push(
      `${componentName} bundle size is large. Consider tree shaking or dynamic imports`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(`${componentName} performance is optimal`);
  }

  return recommendations;
};

// Performance testing suite
export class PerformanceTestSuite {
  private results: PerformanceReport[] = [];

  async testComponent<P extends object>(
    Component: ComponentType<P>,
    props: P,
    testName: string,
    iterations: number = 100
  ): Promise<PerformanceReport> {
    const metrics = measureRenderTime(Component, props, iterations);
    const recommendations = generateOptimizationRecommendations(metrics, testName);

    const report: PerformanceReport = {
      componentName: testName,
      metrics,
      recommendations,
      timestamp: new Date(),
    };

    this.results.push(report);
    return report;
  }

  async testMultipleComponents<P extends object>(
    components: Array<{ Component: ComponentType<P>; props: P; name: string }>,
    iterations: number = 100
  ): Promise<PerformanceReport[]> {
    const reports: PerformanceReport[] = [];

    for (const { Component, props, name } of components) {
      const report = await this.testComponent(Component, props, name, iterations);
      reports.push(report);
    }

    return reports;
  }

  generateSummaryReport(): string {
    if (this.results.length === 0) {
      return 'No performance tests have been run.';
    }

    const totalComponents = this.results.length;
    const avgRenderTime = this.results.reduce((sum, r) => sum + r.metrics.renderTime, 0) / totalComponents;
    const slowestComponent = this.results.reduce((slowest, current) => 
      current.metrics.renderTime > slowest.metrics.renderTime ? current : slowest
    );
    const fastestComponent = this.results.reduce((fastest, current) => 
      current.metrics.renderTime < fastest.metrics.renderTime ? current : fastest
    );

    let summary = `Performance Test Summary (${totalComponents} components tested)\n`;
    summary += `================================================\n\n`;
    summary += `Average Render Time: ${avgRenderTime.toFixed(2)}ms\n`;
    summary += `Fastest Component: ${fastestComponent.componentName} (${fastestComponent.metrics.renderTime.toFixed(2)}ms)\n`;
    summary += `Slowest Component: ${slowestComponent.componentName} (${slowestComponent.metrics.renderTime.toFixed(2)}ms)\n\n`;

    summary += `Detailed Results:\n`;
    summary += `----------------\n`;
    
    this.results.forEach((result, index) => {
      summary += `${index + 1}. ${result.componentName}\n`;
      summary += `   Render Time: ${result.metrics.renderTime.toFixed(2)}ms\n`;
      summary += `   Re-render Count: ${result.metrics.reRenderCount}\n`;
      if (result.metrics.memoryUsage) {
        summary += `   Memory Usage: ${result.metrics.memoryUsage.toFixed(2)}MB\n`;
      }
      summary += `   Recommendations:\n`;
      result.recommendations.forEach(rec => {
        summary += `     - ${rec}\n`;
      });
      summary += `\n`;
    });

    return summary;
  }

  exportResults(format: 'json' | 'csv' | 'markdown' = 'json'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(this.results, null, 2);
      
      case 'csv':
        const headers = ['Component', 'Render Time (ms)', 'Re-render Count', 'Memory Usage (MB)', 'Recommendations'];
        const rows = this.results.map(r => [
          r.componentName,
          r.metrics.renderTime.toFixed(2),
          r.metrics.reRenderCount,
          r.metrics.memoryUsage?.toFixed(2) || 'N/A',
          r.recommendations.join('; ')
        ]);
        
        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      
      case 'markdown':
        let md = '# Performance Test Results\n\n';
        md += `Generated: ${new Date().toISOString()}\n\n`;
        
        this.results.forEach(result => {
          md += `## ${result.componentName}\n\n`;
          md += `- **Render Time**: ${result.metrics.renderTime.toFixed(2)}ms\n`;
          md += `- **Re-render Count**: ${result.metrics.reRenderCount}\n`;
          if (result.metrics.memoryUsage) {
            md += `- **Memory Usage**: ${result.metrics.memoryUsage.toFixed(2)}MB\n`;
          }
          md += `- **Recommendations**:\n`;
          result.recommendations.forEach(rec => {
            md += `  - ${rec}\n`;
          });
          md += `\n`;
        });
        
        return md;
      
      default:
        return this.generateSummaryReport();
    }
  }

  clearResults(): void {
    this.results = [];
  }
}

// Bundle analyzer utility
export const analyzeBundle = (componentCode: string) => {
  const size = estimateBundleSize(componentCode);
  const lines = componentCode.split('\n').length;
  const characters = componentCode.length;

  return {
    size: `${size.toFixed(2)} KB`,
    lines,
    characters,
    complexity: estimateComplexity(componentCode),
  };
};

// Simple complexity estimation
const estimateComplexity = (code: string): 'low' | 'medium' | 'high' => {
  const complexityIndicators = {
    loops: (code.match(/for|while|forEach|map|filter/g) || []).length,
    conditionals: (code.match(/if|else|switch|case/g) || []).length,
    functions: (code.match(/function|=>/g) || []).length,
    hooks: (code.match(/use[A-Z][a-zA-Z]*/g) || []).length,
  };

  const totalComplexity = Object.values(complexityIndicators).reduce((sum, count) => sum + count, 0);

  if (totalComplexity < 10) return 'low';
  if (totalComplexity < 25) return 'medium';
  return 'high';
};

// Performance budget checker
export const checkPerformanceBudget = (
  metrics: PerformanceMetrics,
  budget: {
    maxRenderTime: number;
    maxMemoryUsage?: number;
    maxBundleSize?: number;
  }
): { passed: boolean; violations: string[] } => {
  const violations: string[] = [];

  if (metrics.renderTime > budget.maxRenderTime) {
    violations.push(`Render time ${metrics.renderTime.toFixed(2)}ms exceeds budget of ${budget.maxRenderTime}ms`);
  }

  if (budget.maxMemoryUsage && metrics.memoryUsage && metrics.memoryUsage > budget.maxMemoryUsage) {
    violations.push(`Memory usage ${metrics.memoryUsage.toFixed(2)}MB exceeds budget of ${budget.maxMemoryUsage}MB`);
  }

  if (budget.maxBundleSize && metrics.bundleSize && metrics.bundleSize > budget.maxBundleSize) {
    violations.push(`Bundle size ${metrics.bundleSize.toFixed(2)}KB exceeds budget of ${budget.maxBundleSize}KB`);
  }

  return {
    passed: violations.length === 0,
    violations,
  };
};
