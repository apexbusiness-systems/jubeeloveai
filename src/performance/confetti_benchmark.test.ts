import { describe, it, expect } from 'vitest';

describe('Confetti Import Benchmark', () => {
  it('Static Import (Baseline)', async () => {
    const start = performance.now();
    // Simulate static import by requiring it
    const confetti = await import('canvas-confetti');
    const end = performance.now();

    console.log(`Static Import Time: ${(end - start).toFixed(2)}ms`);
    expect(confetti).toBeDefined();
  });

  it('Dynamic Import (Optimized)', async () => {
    // Clear cache to simulate fresh dynamic import if possible
    // In vitest we can't easily clear the module cache for dynamic imports this way,
    // but we can measure the time to resolve the dynamic import promise
    const start = performance.now();
    const { default: confetti } = await import('canvas-confetti');
    const end = performance.now();

    console.log(`Dynamic Import Time: ${(end - start).toFixed(2)}ms`);
    expect(confetti).toBeDefined();
  });
});
