import { describe, it, expect } from 'vitest';

describe('offlineQueue getStats useMemo Optimization', () => {
  it('should be faster to compute queue stats in a single pass', () => {
    // Generate large mock dataset
    const numItems = 10000;
    const queue = Array.from({ length: numItems }).map((_, i) => ({
      type: ['sync', 'upload', 'delete', 'update'][i % 4],
      priority: (i % 10) + 1,
      retries: i % 5 === 0 ? 1 : 0
    }));

    // Baseline: two reduce passes + one filter
    const startBaseline = performance.now();
    const byTypeBaseline = queue.reduce((acc, op) => {
        acc[op.type] = (acc[op.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const byPriorityBaseline = queue.reduce((acc, op) => {
        acc[op.priority] = (acc[op.priority] || 0) + 1;
        return acc;
    }, {} as Record<number, number>);
    const failedBaseline = queue.filter(op => op.retries > 0).length;

    const statsBaseline = {
        total: queue.length,
        byType: byTypeBaseline,
        byPriority: byPriorityBaseline,
        failed: failedBaseline
    };
    const endBaseline = performance.now();
    const baselineTime = endBaseline - startBaseline;

    // Optimized: single loop O(n)
    const startOptimized = performance.now();

    const byTypeOptimized: Record<string, number> = {};
    const byPriorityOptimized: Record<number, number> = {};
    let failedOptimized = 0;

    for (let i = 0; i < queue.length; i++) {
        const op = queue[i];
        byTypeOptimized[op.type] = (byTypeOptimized[op.type] || 0) + 1;
        byPriorityOptimized[op.priority] = (byPriorityOptimized[op.priority] || 0) + 1;
        if (op.retries > 0) failedOptimized++;
    }

    const statsOptimized = {
        total: queue.length,
        byType: byTypeOptimized,
        byPriority: byPriorityOptimized,
        failed: failedOptimized
    };

    const endOptimized = performance.now();
    const optimizedTime = endOptimized - startOptimized;

    console.log(`Baseline (reducex2 + filter): ${baselineTime.toFixed(2)}ms`);
    console.log(`Optimized (for loop): ${optimizedTime.toFixed(2)}ms`);
    console.log(`Speedup: ${(baselineTime / optimizedTime).toFixed(2)}x`);

    expect(statsOptimized).toEqual(statsBaseline);
  });
});
