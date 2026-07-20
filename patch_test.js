const fs = require('fs');
const filepath = 'src/performance/zustand_selectors_benchmark.test.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// The issue is global.localStorage mocking must happen before store import!
// Wait, actually useParentalStore is imported BEFORE the beforeEach, so the module initializes with global.localStorage undefined (since it's jsdom but we might need to mock it earlier, or jsdom HAS localStorage but vitest setup mocks it?).
// Ah, the error is: ReferenceError: localStorage is not defined
// That means localStorage is literally not defined globally when useParentalStore.setState triggers a state update, which triggers a persist to localStorage.
