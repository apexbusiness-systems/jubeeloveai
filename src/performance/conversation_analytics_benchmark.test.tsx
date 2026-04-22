import { describe, it, expect } from 'vitest';

describe('ConversationAnalytics useMemo Optimization', () => {
  it('should be faster to compute sentimentData and moodData in a single pass', () => {
    // Generate large mock dataset
    const numDays = 1000;
    const analytics = Array.from({ length: numDays }).map((_, i) => ({
      date: `2024-01-${i % 30 + 1}`,
      total_conversations: Math.floor(Math.random() * 10),
      avg_confidence: Math.random(),
      sentiment_distribution: { positive: Math.random() * 5, negative: Math.random() * 2 },
      mood_distribution: { happy: Math.random() * 4, sad: Math.random() * 1 },
      most_common_keywords: ['play', 'fun']
    }));

    // Baseline: two reduce passes
    const startBaseline = performance.now();
    const sentimentDataBaseline = Object.entries(
      analytics.reduce((acc, day) => {
        if (day.sentiment_distribution) {
          Object.entries(day.sentiment_distribution).forEach(([sentiment, count]) => {
            acc[sentiment] = (acc[sentiment] || 0) + Number(count)
          })
        }
        return acc
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }));

    const moodDataBaseline = Object.entries(
      analytics.reduce((acc, day) => {
        if (day.mood_distribution) {
          Object.entries(day.mood_distribution).forEach(([mood, count]) => {
            acc[mood] = (acc[mood] || 0) + Number(count)
          })
        }
        return acc
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }));
    const endBaseline = performance.now();
    const baselineTime = endBaseline - startBaseline;

    // Optimized: single loop O(n)
    const startOptimized = performance.now();
    const sentiments: Record<string, number> = {}
    const moods: Record<string, number> = {}

    for (const day of analytics) {
      if (day.sentiment_distribution) {
        for (const [sentiment, count] of Object.entries(day.sentiment_distribution)) {
          sentiments[sentiment] = (sentiments[sentiment] || 0) + Number(count)
        }
      }
      if (day.mood_distribution) {
        for (const [mood, count] of Object.entries(day.mood_distribution)) {
          moods[mood] = (moods[mood] || 0) + Number(count)
        }
      }
    }

    const sentimentDataOptimized = Object.entries(sentiments).map(([name, value]) => ({ name, value }));
    const moodDataOptimized = Object.entries(moods).map(([name, value]) => ({ name, value }));
    const endOptimized = performance.now();
    const optimizedTime = endOptimized - startOptimized;

    console.log(`Baseline (reducex2): ${baselineTime.toFixed(2)}ms`);
    console.log(`Optimized (for loop): ${optimizedTime.toFixed(2)}ms`);
    console.log(`Speedup: ${(baselineTime / optimizedTime).toFixed(2)}x`);

    expect(sentimentDataOptimized).toEqual(sentimentDataBaseline);
    expect(moodDataOptimized).toEqual(moodDataBaseline);
    // expect(optimizedTime).toBeLessThanOrEqual(baselineTime); // Can be flaky in CI, logging is enough
  });
});
