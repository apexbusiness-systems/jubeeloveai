import { describe, it, expect } from 'vitest';
import { Skills } from '@/lib/mastery/taxonomy';

describe('ParentHub O(n^2) Optimization', () => {
  it('should be faster to precompute a skill dictionary', () => {
    // Generate mock strongest skills
    const numChildren = 10;
    const numSkillsPerChild = 5;

    // Some random skills to match
    const mockSkills = [
      { skillId: 'alphabet' }, { skillId: 'phonics' }, { skillId: 'reading' },
      { skillId: 'story' }, { skillId: 'counting' }
    ];

    // Baseline O(n^2) where n = number of Skills * number of skills to map
    const startBaseline = performance.now();
    for (let c = 0; c < 1000; c++) {
      mockSkills.map(s => Object.values(Skills).find(sk => sk.id === s.skillId)?.name || s.skillId);
    }
    const endBaseline = performance.now();
    const baselineTime = endBaseline - startBaseline;

    // Optimized O(1) lookup
    const startOptimized = performance.now();
    const skillsById = Object.values(Skills).reduce((acc, skill) => {
      acc[skill.id] = skill.name;
      return acc;
    }, {} as Record<string, string>);

    for (let c = 0; c < 1000; c++) {
      mockSkills.map(s => skillsById[s.skillId] || s.skillId);
    }
    const endOptimized = performance.now();
    const optimizedTime = endOptimized - startOptimized;

    console.log(`Baseline (find inside map): ${baselineTime.toFixed(2)}ms`);
    console.log(`Optimized (dictionary lookup): ${optimizedTime.toFixed(2)}ms`);
    console.log(`Speedup: ${(baselineTime / optimizedTime).toFixed(2)}x`);

    expect(optimizedTime).toBeLessThan(baselineTime);
  });
});
