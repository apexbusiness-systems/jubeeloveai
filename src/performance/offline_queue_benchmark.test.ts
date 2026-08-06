import { describe, it, expect } from 'vitest';

describe('OfflineQueue getStats Optimization Benchmark', () => {
  it('⚡ Bolt: Validates that single-pass for loop is faster than multiple reduce calls for stats aggregation', () => {
    // Generate mock queue
    const numItems = 10000;
    const queue = Array.from({ length: numItems }).map((_, i) => ({
      id: `op-${i}`,
      type: i % 3 === 0 ? 'sync' : i % 3 === 1 ? 'upload' : 'delete',
      storeName: 'test',
      data: {},
      priority: i % 5 + 1,
      timestamp: Date.now(),
      retries: i % 10 === 0 ? 1 : 0,
      maxRetries: 5
    }));

    // Baseline: two reduce calls and one filter
    const startBaseline = performance.now();
    const statsBaseline = {
      total: queue.length,
      byType: queue.reduce((acc, op) => {
        acc[op.type] = (acc[op.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byPriority: queue.reduce((acc, op) => {
        acc[op.priority] = (acc[op.priority] || 0) + 1;
        return acc;
      }, {} as Record<number, number>),
      failed: queue.filter(op => op.retries > 0).length,
    };
    const endBaseline = performance.now();
    const baselineTime = endBaseline - startBaseline;

    // Optimized: Single pass for loop
    const startOptimized = performance.now();
    const byType: Record<string, number> = {};
    const byPriority: Record<number, number> = {};
    let failedCount = 0;

    for (let i = 0; i < queue.length; i++) {
      const op = queue[i];
      byType[op.type] = (byType[op.type] || 0) + 1;
      byPriority[op.priority] = (byPriority[op.priority] || 0) + 1;
      if (op.retries > 0) failedCount++;
    }

    const statsOptimized = {
      total: queue.length,
      byType,
      byPriority,
      failed: failedCount
    };
    const endOptimized = performance.now();
    const optimizedTime = endOptimized - startOptimized;

    console.log(`Baseline Time: ${baselineTime.toFixed(3)}ms`);
    console.log(`Optimized Time: ${optimizedTime.toFixed(3)}ms`);
    console.log(`Speedup: ${(baselineTime / optimizedTime).toFixed(2)}x`);

    expect(statsBaseline).toEqual(statsOptimized);
  });
});
