import { describe, it, expect } from 'vitest'

describe('ParentHub Skills Lookup Optimization', () => {
  const Skills = {
    ALPHABET: { id: 'alphabet', name: 'Alphabet Recognition' },
    PHONICS: { id: 'phonics', name: 'Phonics' },
    READING: { id: 'reading', name: 'Reading Practice' },
    STORY: { id: 'story', name: 'Story Listening' },
    COUNTING: { id: 'counting', name: 'Counting' },
    NUMBER_REC: { id: 'number_rec', name: 'Number Recognition' },
    COLOR_ID: { id: 'color_id', name: 'Color Identification' },
    SHAPE_REC: { id: 'shape_rec', name: 'Shape Recognition' },
    MEMORY: { id: 'memory', name: 'Memory' },
    PATTERNING: { id: 'patterning', name: 'Patterning' },
    TRACING: { id: 'tracing', name: 'Tracing & Writing' }
  };

  const skillMap = Object.values(Skills).reduce((acc, skill) => {
    acc[skill.id] = skill;
    return acc;
  }, {} as Record<string, typeof Skills[keyof typeof Skills]>);

  const testIds = ['alphabet', 'color_id', 'tracing', 'unknown'];
  const ITERATIONS = 100000;

  it('measures unoptimized Object.values().find() performance', () => {
    const start = performance.now();
    let foundCount = 0;

    for (let i = 0; i < ITERATIONS; i++) {
      for (const id of testIds) {
        const found = Object.values(Skills).find(sk => sk.id === id);
        if (found) foundCount++;
      }
    }

    const time = performance.now() - start;
    console.log(`Unoptimized (Object.values().find): ${time.toFixed(2)}ms`);
    expect(foundCount).toBeGreaterThan(0);
  });

  it('measures optimized O(1) Map lookup performance', () => {
    const start = performance.now();
    let foundCount = 0;

    for (let i = 0; i < ITERATIONS; i++) {
      for (const id of testIds) {
        const found = skillMap[id];
        if (found) foundCount++;
      }
    }

    const time = performance.now() - start;
    console.log(`Optimized O(1) Map lookup: ${time.toFixed(2)}ms`);
    expect(foundCount).toBeGreaterThan(0);
  });
});
