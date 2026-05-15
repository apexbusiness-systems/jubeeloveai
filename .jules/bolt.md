## 2024-05-15 - Zustand selector optimization
**Learning:** Multiple separate store selectors (e.g. `useStore(state => state.foo)`, `useStore(state => state.bar)`) cause multiple subscriptions and potential unnecessary re-renders. Using `useShallow` from `zustand/react/shallow` with a single selector object significantly reduces overhead and re-renders.
**Action:** Always group Zustand selectors using `useShallow` when pulling multiple properties from the same store in a single component.
