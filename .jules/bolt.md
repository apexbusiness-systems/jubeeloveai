## 2025-04-07 - React.memo with JSX Props
**Learning:** Adding `React.memo` to a component that receives JSX elements as props (like `<TabButton icon={<HomeIcon />} />`) is entirely ineffective because JSX elements are re-created as new objects on every render of the parent component. Shallow comparison fails, and the child re-renders anyway.
**Action:** Always wrap JSX props in `useMemo` or hoist them outside the component if they are static before applying `React.memo` to the child component receiving them.
