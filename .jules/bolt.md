## 2024-05-14 - Zustand Selector Optimization
**Learning:** Multiple independent `useStore(state => state.foo)` calls in a single component or hook create multiple individual subscriptions to the Zustand store, increasing overhead.
**Action:** Group these into a single selector using `useShallow` from `zustand/react/shallow` to reduce subscription count and memory overhead without causing unnecessary re-renders. (e.g. `const { a, b } = useStore(useShallow(state => ({ a: state.a, b: state.b })))`).
