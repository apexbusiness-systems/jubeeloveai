## 2025-02-12 - [Zustand useShallow Optimization]
**Learning:** Multiple individual Zustand selectors in React components/hooks (e.g. `const score = useGameStore(s => s.score); const theme = useGameStore(s => s.theme);`) create multiple subscriptions to the store.
**Action:** Group related selectors into a single object and wrap them with `useShallow` (e.g. `const { score, theme } = useGameStore(useShallow(s => ({ score: s.score, theme: s.theme })))`) to reduce store subscriptions and unnecessary re-renders.

## 2025-02-12 - [Zustand Hook Optimization in Custom Hooks]
**Learning:** Zustand selectors called multiple times within a *custom React hook* (like `usePageVisitTracker` or `useJubeeLifecycleDiagnostics`) will trigger unnecessary component re-renders for any component consuming that custom hook when unrelated store state changes. This is because each `useStore(selector)` call creates an independent subscription tied to the calling component.
**Action:** Group these selectors using `useShallow` so only one subscription is created per custom hook, minimizing the React re-render impact across the application.
