## 2025-02-12 - [Zustand useShallow Optimization]
**Learning:** Multiple individual Zustand selectors in React components/hooks (e.g. `const score = useGameStore(s => s.score); const theme = useGameStore(s => s.theme);`) create multiple subscriptions to the store.
**Action:** Group related selectors into a single object and wrap them with `useShallow` (e.g. `const { score, theme } = useGameStore(useShallow(s => ({ score: s.score, theme: s.theme })))`) to reduce store subscriptions and unnecessary re-renders.

## 2025-02-12 - [Zustand useShallow Optimization]
**Learning:** Multiple individual Zustand selectors in React components/hooks (e.g. `const score = useGameStore(s => s.score); const theme = useGameStore(s => s.theme);`) create multiple subscriptions to the store, which can cause performance issues due to excessive re-rendering and subscription overhead. This is a common performance anti-pattern.
**Action:** Group related selectors into a single object and wrap them with `useShallow` (e.g. `const { score, theme } = useGameStore(useShallow(s => ({ score: s.score, theme: s.theme })))`) to reduce store subscriptions and unnecessary re-renders.

## 2024-07-05 - Stable `useCallback` via `useRef` for Large Mapped Components
**Learning:** When passing callbacks to a large number of components mapped from an array (like 241 `MusicCard` components in `src/pages/Music.tsx`), if the callback has dependencies on state (like `currentSong` or `isPlaying`), it will get a new reference on every state change. This invalidates the `React.memo` for ALL children, causing O(N) re-renders even when only 1 or 2 items actually changed. Also, always update `stateRef.current` inside a `useEffect` or `useLayoutEffect` to avoid bugs in React Concurrent mode.
**Action:** Use a `useRef` (e.g., `stateRef`) to hold the latest state values, and update it in a `useEffect`. Read from `stateRef.current` inside the `useCallback` with an empty dependency array `[]`. This keeps the callback reference stable, allowing `React.memo` on the child components to effectively prevent unnecessary re-renders.

## 2025-02-13 - [Zustand Selectors Refinement]
**Learning:** While grouping multiple selectors from the same store using \`useShallow\` reduces subscriptions (e.g. \`const { speak, triggerAnimation } = useJubeeStore(useShallow(state => ({ speak: state.speak, triggerAnimation: state.triggerAnimation })))\`), trying to group a single selector using \`useShallow\` is a regression and provides no benefit while adding overhead. Also, you must make sure \`useShallow\` is imported when using it.
**Action:** Only use \`useShallow\` when grouping **multiple** state properties from the same store. If only one property is needed from a store (like \`const addScore = useGameStore(state => state.addScore)\`), leave it as a simple selector.
