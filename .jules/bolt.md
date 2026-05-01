## 2024-05-18 - Zustand Array Selector Optimization
**Learning:** In Zustand stores using Immer (like `useParentalStore`), updating *any* property of an object inside an array creates a new reference for the array itself. Components subscribing to the entire array (e.g., `const children = useParentalStore(state => state.children)`) will re-render unnecessarily even if the specific data they care about hasn't changed.
**Action:** When a component only needs derived data from an array (like its length or a specific item), write a targeted selector (e.g., `state => state.children.length > 0` or `state => state.children.find(c => c.id === state.activeChildId)`) to prevent widespread re-renders across the app.

## 2024-05-18 - Zustand Array Selector Optimization applied
**Learning:** Zustand array selectors can be optimized by targeting the specific element derived. `state => state.children.find(c => c.id === state.activeChildId)` effectively reduces component rerenders over `const children = useParentalStore(state => state.children); const activeChild = children.find(c => c.id === activeChildId);`.
**Action:** Always refine selectors to return the exact piece of data needed rather than a larger object/array.
