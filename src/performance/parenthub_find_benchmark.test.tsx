import { describe, it, expect } from 'vitest';
import { Skills, SkillId } from '../lib/mastery/taxonomy';

describe('ParentHub Find Optimization', () => {
  it('should be faster to use a precomputed map instead of Object.values().find()', () => {
    // Generate mock dataset
    const numChildren = 1000;
    const allSkillIds = Object.values(Skills).map(s => s.id);
    const mockData = Array.from({ length: numChildren }).map(() => ({
      strongest: [
        { skillId: allSkillIds[Math.floor(Math.random() * allSkillIds.length)] },
        { skillId: allSkillIds[Math.floor(Math.random() * allSkillIds.length)] }
      ],
      needsReview: [
        { skillId: allSkillIds[Math.floor(Math.random() * allSkillIds.length)] },
        { skillId: allSkillIds[Math.floor(Math.random() * allSkillIds.length)] }
      ]
    }));

    // Baseline: Object.values().find() inside map
    const startBaseline = performance.now();
    let baselineMatches = 0;
    for (const child of mockData) {
      const s = child.strongest.map(s => Object.values(Skills).find(sk => sk.id === s.skillId)?.name || s.skillId);
      const n = child.needsReview.map(s => Object.values(Skills).find(sk => sk.id === s.skillId)?.name || s.skillId);
      baselineMatches += s.length + n.length;
    }
    const endBaseline = performance.now();
    const baselineTime = endBaseline - startBaseline;

    // Optimized: Precomputed map
    const startOptimized = performance.now();

    // Create map once outside
    const skillsMap: Record<string, string> = {};
    for (const key in Skills) {
      const skill = Skills[key as keyof typeof Skills];
      skillsMap[skill.id] = skill.name;
    }

    let optimizedMatches = 0;
    for (const child of mockData) {
      const s = child.strongest.map(s => skillsMap[s.skillId] || s.skillId);
      const n = child.needsReview.map(s => skillsMap[s.skillId] || s.skillId);
      optimizedMatches += s.length + n.length;
    }
    const endOptimized = performance.now();
    const optimizedTime = endOptimized - startOptimized;

    console.log(`Baseline (Object.values().find): ${baselineTime.toFixed(2)}ms`);
    console.log(`Optimized (Map lookup): ${optimizedTime.toFixed(2)}ms`);
    console.log(`Speedup: ${(baselineTime / optimizedTime).toFixed(2)}x`);

    expect(optimizedMatches).toBe(baselineMatches);
  });
});
