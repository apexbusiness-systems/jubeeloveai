## 2025-02-12 - [Zustand useShallow Optimization]
**Learning:** Multiple individual Zustand selectors in React components/hooks (e.g. `const score = useGameStore(s => s.score); const theme = useGameStore(s => s.theme);`) create multiple subscriptions to the store.
**Action:** Group related selectors into a single object and wrap them with `useShallow` (e.g. `const { score, theme } = useGameStore(useShallow(s => ({ score: s.score, theme: s.theme })))`) to reduce store subscriptions and unnecessary re-renders.
## 2025-06-21 - [React.memo on List Components]
**Learning:** Home page renders multiple instances of functional components like `GameCard` which can cause unnecessary re-renders when parent states change, especially on low-end devices.
**Action:** Wrap functional components rendered in lists or multiple times within a parent component using `React.memo()` to prevent re-renders when props haven't changed.
