import { describe, it, expect } from 'vitest';
import { Skills } from '../lib/mastery/taxonomy';

describe('Skills Hash Map Optimization', () => {
  it('benchmarks Object.values().find() vs O(1) hash map lookup', () => {
    const skillIds = ['alphabet', 'counting', 'memory', 'tracing', 'phonics', 'number_rec'];

    // Unoptimized O(N) lookup
    const startUnoptimized = performance.now();
    for (let i = 0; i < 10000; i++) {
      skillIds.map(id => Object.values(Skills).find(sk => sk.id === id)?.name || id);
    }
    const unoptimizedTime = performance.now() - startUnoptimized;

    // Create optimized map
    const SkillsMap = Object.values(Skills).reduce((acc, skill) => {
      acc[skill.id] = skill.name;
      return acc;
    }, {} as Record<string, string>);

    // Optimized O(1) lookup
    const startOptimized = performance.now();
    for (let i = 0; i < 10000; i++) {
      skillIds.map(id => SkillsMap[id] || id);
    }
    const optimizedTime = performance.now() - startOptimized;

    console.log(`Unoptimized (Object.values.find): ${unoptimizedTime.toFixed(2)}ms`);
    console.log(`Optimized (Hash Map): ${optimizedTime.toFixed(2)}ms`);
    console.log(`Speedup: ${(unoptimizedTime / optimizedTime).toFixed(2)}x`);

    expect(optimizedTime).toBeLessThan(unoptimizedTime);
  });
});
