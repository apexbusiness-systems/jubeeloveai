import { describe, it } from 'vitest';
import { analyzeSentiment } from '../lib/sentimentUtils';

describe('Sentiment Analysis Benchmark', () => {
  it('should be fast', () => {
    const text = "Wow! This is amazing and so cool. I love it and it is the best. Yay!";

    // warm up
    for (let i = 0; i < 1000; i++) analyzeSentiment(text);

    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      analyzeSentiment(text);
    }
    const end = performance.now();

    console.log(`Time: ${(end - start).toFixed(2)}ms`);
  });
});
