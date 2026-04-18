const fs = require('fs');
let content = fs.readFileSync('src/performance/zustand_selectors_benchmark.test.tsx', 'utf8');

if (!content.includes('global.localStorage')) {
  content = content.replace(
    `describe('Zustand Selectors Performance Benchmark', () => {`,
    `describe('Zustand Selectors Performance Benchmark', () => {
  beforeEach(() => {
    // Mock localStorage
    const store = {};
    global.localStorage = {
      getItem: vi.fn(key => store[key] || null),
      setItem: vi.fn((key, value) => { store[key] = value.toString() }),
      removeItem: vi.fn(key => { delete store[key] }),
      clear: vi.fn(() => { for (const key in store) delete store[key] }),
    };
  });
`
  );
  fs.writeFileSync('src/performance/zustand_selectors_benchmark.test.tsx', content);
}
console.log('done');
