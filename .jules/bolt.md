## 2024-05-10 - Zustand Selector Optimization with useShallow
**Learning:** Consolidating multiple separate `useStore(state => state.property)` calls into a single `useStore(useShallow(state => ({ prop1: state.prop1, prop2: state.prop2 })))` reduces store subscriptions and hook execution overhead.
**Action:** Use `useShallow` from `zustand/react/shallow` when extracting multiple top-level properties from the same Zustand store to improve performance and lower memory footprint.
