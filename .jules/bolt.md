## 2024-05-25 - Zustand store subscription optimization
**Learning:** In React components that access multiple values from a single Zustand store, using individual atomic selectors (e.g. `const A = useStore(state => state.A); const B = useStore(state => state.B);`) creates independent `useSyncExternalStore` listener subscriptions for each hook. In scenarios with numerous store properties accessed in one component, this creates overhead.
**Action:** Use `useShallow` from `zustand/react/shallow` to group multiple selectors into a single object-returning selector. This reduces the number of store subscriptions and slightly lowers component overhead, while still preventing unnecessary re-renders when other unselected store properties change. For example:
```typescript
const { A, B } = useStore(useShallow(state => ({ A: state.A, B: state.B })));
```
