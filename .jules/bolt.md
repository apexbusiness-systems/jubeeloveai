## 2025-02-12 - [Zustand useShallow Optimization]
**Learning:** Multiple individual Zustand selectors in React components/hooks (e.g. `const isVisible = useJubeeStore(s => s.isVisible); const position = useJubeeStore(s => s.position);`) create multiple subscriptions to the store.
**Action:** Group related selectors into a single object and wrap them with `useShallow` (e.g. `const { isVisible, position } = useJubeeStore(useShallow(s => ({ isVisible: s.isVisible, position: s.position })))`) to reduce store subscriptions and unnecessary re-renders.
