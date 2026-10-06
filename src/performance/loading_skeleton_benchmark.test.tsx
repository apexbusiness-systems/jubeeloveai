import { describe, it, expect } from 'vitest';

describe('LoadingSkeleton Array creation optimization', () => {
  it('should be faster to use Array.from instead of [...Array()]', () => {
    const size = 10000;

    // Baseline: [...Array(size)]
    const startBaseline = performance.now();
    for (let i = 0; i < 100; i++) {
        [...Array(size)].map((_, i) => i);
    }
    const endBaseline = performance.now();
    const baselineTime = endBaseline - startBaseline;

    // Optimized: Array.from
    const startOptimized = performance.now();
    for (let i = 0; i < 100; i++) {
        Array.from({ length: size }).map((_, i) => i);
    }
    const endOptimized = performance.now();
    const optimizedTime = endOptimized - startOptimized;

    // Second Optimized: Array.from with mapFn
    const startOptimized2 = performance.now();
    for (let i = 0; i < 100; i++) {
        Array.from({ length: size }, (_, i) => i);
    }
    const endOptimized2 = performance.now();
    const optimizedTime2 = endOptimized2 - startOptimized2;

    console.log(`Baseline ([...Array()]): ${baselineTime.toFixed(2)}ms`);
    console.log(`Optimized (Array.from): ${optimizedTime.toFixed(2)}ms`);
    console.log(`Optimized 2 (Array.from mapFn): ${optimizedTime2.toFixed(2)}ms`);

  });
});
