import { describe, it, expect } from 'vitest';

describe('Sync Benchmark', () => {
  it('should be faster to use Promise.allSettled for parallel syncs than serial await', async () => {
    const iterations = 50;

    // Simulate serial await
    const startSerial = performance.now();
    for (let i = 0; i < iterations; i++) {
      await new Promise(resolve => setTimeout(resolve, 2));
    }
    const durationSerial = performance.now() - startSerial;

    // Simulate parallel Promise.allSettled
    const startParallel = performance.now();
    const promises = Array.from({ length: iterations }, () =>
      new Promise(resolve => setTimeout(resolve, 2))
    );
    await Promise.allSettled(promises);
    const durationParallel = performance.now() - startParallel;

    console.log(`Serial Sync: ${durationSerial.toFixed(2)}ms`);
    console.log(`Parallel Sync: ${durationParallel.toFixed(2)}ms`);
    console.log(`Speedup: ${(durationSerial / durationParallel).toFixed(2)}x`);

    expect(durationParallel).toBeLessThan(durationSerial);
  });
});
