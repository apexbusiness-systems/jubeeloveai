import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Skills } from '../lib/mastery/taxonomy';

describe('ParentHub Rendering Performance', () => {
  it('measures rendering time of O(n) vs O(1) skill lookup', () => {
    // Generate dummy data
    const skills = Object.values(Skills);
    const renderCount = 1000;

    // Simulate original O(n) lookup with .find() inside .map()
    const startOriginal = performance.now();
    for (let i = 0; i < renderCount; i++) {
        const dummySkillId = 'reading'; // Use a valid skill ID
        const result = Object.values(Skills).find(sk => sk.id === dummySkillId)?.name || dummySkillId;
    }
    const endOriginal = performance.now();

    // Create skill lookup map
    const startMapCreation = performance.now();
    const skillNameMap = new Map(Object.values(Skills).map(s => [s.id, s.name]));
    const endMapCreation = performance.now();

    // Simulate optimized O(1) lookup
    const startOptimized = performance.now();
    for (let i = 0; i < renderCount; i++) {
        const dummySkillId = 'reading';
        const result = skillNameMap.get(dummySkillId) || dummySkillId;
    }
    const endOptimized = performance.now();

    console.log(`Original O(N) Lookup Time: ${(endOriginal - startOriginal).toFixed(4)}ms`);
    console.log(`Optimized O(1) Lookup Time: ${(endOptimized - startOptimized).toFixed(4)}ms`);

    expect(endOptimized - startOptimized).toBeLessThan(endOriginal - startOriginal);
  });
});
