## 2024-06-24 - Grouping Zustand Selectors
**Learning:** Selecting individual state properties in separate `useStore` calls causes unnecessary component re-renders every time any state in the store updates. Zustand's `useShallow` hook combined with an object selector enables selecting multiple properties while preserving memoization and avoiding extra subscriptions.
**Action:** Always group multiple Zustand selectors into a single `useStore(useShallow(state => ({ ... })))` call instead of multiple `const prop = useStore(state => state.prop);` calls within the same component.
