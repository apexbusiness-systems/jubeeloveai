## 2025-04-07 - React.memo with JSX Props
**Learning:** Adding `React.memo` to a component that receives JSX elements as props (like `<TabButton icon={<HomeIcon />} />`) is entirely ineffective because JSX elements are re-created as new objects on every render of the parent component. Shallow comparison fails, and the child re-renders anyway.
**Action:** Always wrap JSX props in `useMemo` or hoist them outside the component if they are static before applying `React.memo` to the child component receiving them.

## 2025-04-09 - Zustand Performance with Selectors
**Learning:** Using global store hooks like `const { state1 } = useStore()` without a selector subscribes the component to the ENTIRE store. In stores like `useJubeeStore` or `useParentalStore` where state updates rapidly (e.g., animations, timers), this causes sweeping unnecessary re-renders across the entire app.
**Action:** Always use granular selectors like `const state1 = useStore(state => state.state1)` when consuming global stores to ensure components only re-render when the state they actually care about changes.
