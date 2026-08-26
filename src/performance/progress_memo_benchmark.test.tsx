import { describe, it, expect } from 'vitest';

describe('ProgressPage rendering optimization', () => {
  it('should be faster to pre-compute formatted strings', () => {
    // Generate large mock dataset
    const numActivities = 10000;
    const completedActivities = Array.from({ length: numActivities }).map((_, i) => `activity-name-test-${i}`);

    // Baseline: string replace in render
    const startBaseline = performance.now();
    for (let i = 0; i < 100; i++) { // simulate 100 renders
      completedActivities.map(activity => activity.replace('-', ' '));
    }
    const endBaseline = performance.now();
    const baselineTime = endBaseline - startBaseline;

    // Optimized: memoized string replace
    const startOptimized = performance.now();
    const formattedActivities = completedActivities.map(activity => activity.replace(/-/g, ' '));
    for (let i = 0; i < 100; i++) { // simulate 100 renders
      formattedActivities.map(formatted => formatted);
    }
    const endOptimized = performance.now();
    const optimizedTime = endOptimized - startOptimized;

    console.log(`Baseline (.replace in render loop): ${baselineTime.toFixed(2)}ms`);
    console.log(`Optimized (memoized array): ${optimizedTime.toFixed(2)}ms`);

    expect(optimizedTime).toBeLessThanOrEqual(baselineTime);
  });
});
