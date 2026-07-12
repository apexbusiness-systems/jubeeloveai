## 2025-02-12 - [Zustand useShallow Optimization]
**Learning:** Multiple individual Zustand selectors in React components/hooks (e.g. `const score = useGameStore(s => s.score); const theme = useGameStore(s => s.theme);`) create multiple subscriptions to the store.
**Action:** Group related selectors into a single object and wrap them with `useShallow` (e.g. `const { score, theme } = useGameStore(useShallow(s => ({ score: s.score, theme: s.theme })))`) to reduce store subscriptions and unnecessary re-renders.

## 2025-02-12 - [Zustand useShallow Optimization]
**Learning:** Multiple individual Zustand selectors in React components/hooks (e.g. `const score = useGameStore(s => s.score); const theme = useGameStore(s => s.theme);`) create multiple subscriptions to the store, which can cause performance issues due to excessive re-rendering and subscription overhead. This is a common performance anti-pattern.
**Action:** Group related selectors into a single object and wrap them with `useShallow` (e.g. `const { score, theme } = useGameStore(useShallow(s => ({ score: s.score, theme: s.theme })))`) to reduce store subscriptions and unnecessary re-renders.

## 2024-07-05 - Stable `useCallback` via `useRef` for Large Mapped Components
**Learning:** When passing callbacks to a large number of components mapped from an array (like 241 `MusicCard` components in `src/pages/Music.tsx`), if the callback has dependencies on state (like `currentSong` or `isPlaying`), it will get a new reference on every state change. This invalidates the `React.memo` for ALL children, causing O(N) re-renders even when only 1 or 2 items actually changed. Also, always update `stateRef.current` inside a `useEffect` or `useLayoutEffect` to avoid bugs in React Concurrent mode.
**Action:** Use a `useRef` (e.g., `stateRef`) to hold the latest state values, and update it in a `useEffect`. Read from `stateRef.current` inside the `useCallback` with an empty dependency array `[]`. This keeps the callback reference stable, allowing `React.memo` on the child components to effectively prevent unnecessary re-renders.
## 2026-07-12 - [Static Array Pre-allocation for Render Loops]
**Learning:** Inline array creations (like `[...Array(6)]` or `Array.from({ length: 40 })`) inside React components create a new array reference on every render, triggering unnecessary memory allocation and garbage collection overhead, especially in deeply nested or frequently re-rendered components.
**Action:** Extract these into static, pre-allocated array constants outside the component (e.g., `const ITEMS_6 = Array.from({ length: 6 })`) when used purely for mapping repetitive UI elements, reducing allocation overhead during render cycles.
