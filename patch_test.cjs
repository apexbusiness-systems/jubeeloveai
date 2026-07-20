const fs = require('fs');
const filepath = 'src/performance/zustand_selectors_benchmark.test.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// According to AGENTS.md:
// "When testing modules that initialize with `localStorage` access at the global scope, `global.localStorage` must be mocked *before* importing the module in the test file."

const newContent = content.replace(
  "import { useParentalStore } from '../store/useParentalStore';",
  `
// Mock localStorage BEFORE importing the store
const store: Record<string, string> = {};
global.localStorage = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = String(value);
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    for (const key in store) delete store[key];
  }),
  key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  get length() {
    return Object.keys(store).length;
  },
} as unknown as Storage;

import { useParentalStore } from '../store/useParentalStore';
`
);

fs.writeFileSync(filepath, newContent);
