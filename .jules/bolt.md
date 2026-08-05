## 2025-02-12 - [Zustand useShallow Optimization]
**Learning:** Multiple individual Zustand selectors in React components/hooks (e.g. `const score = useGameStore(s => s.score); const theme = useGameStore(s => s.theme);`) create multiple subscriptions to the store.
**Action:** Group related selectors into a single object and wrap them with `useShallow` (e.g. `const { score, theme } = useGameStore(useShallow(s => ({ score: s.score, theme: s.theme })))`) to reduce store subscriptions and unnecessary re-renders.

## 2025-02-12 - [Zustand useShallow Optimization]
**Learning:** Multiple individual Zustand selectors in React components/hooks (e.g. `const score = useGameStore(s => s.score); const theme = useGameStore(s => s.theme);`) create multiple subscriptions to the store, which can cause performance issues due to excessive re-rendering and subscription overhead. This is a common performance anti-pattern.
**Action:** Group related selectors into a single object and wrap them with `useShallow` (e.g. `const { score, theme } = useGameStore(useShallow(s => ({ score: s.score, theme: s.theme })))`) to reduce store subscriptions and unnecessary re-renders.

## 2024-07-05 - Stable `useCallback` via `useRef` for Large Mapped Components
**Learning:** When passing callbacks to a large number of components mapped from an array (like 241 `MusicCard` components in `src/pages/Music.tsx`), if the callback has dependencies on state (like `currentSong` or `isPlaying`), it will get a new reference on every state change. This invalidates the `React.memo` for ALL children, causing O(N) re-renders even when only 1 or 2 items actually changed. Also, always update `stateRef.current` inside a `useEffect` or `useLayoutEffect` to avoid bugs in React Concurrent mode.
**Action:** Use a `useRef` (e.g., `stateRef`) to hold the latest state values, and update it in a `useEffect`. Read from `stateRef.current` inside the `useCallback` with an empty dependency array `[]`. This keeps the callback reference stable, allowing `React.memo` on the child components to effectively prevent unnecessary re-renders.

## 2025-02-12 - [React.memo Optimization for Static Props]
**Learning:** When a parent component holds state that changes frequently (e.g., time tracking), child components with static or primitive props will unnecessarily re-render on every state update.
**Action:** Wrap presentational components (like `GameCard`, `QuickActionCard`) in `React.memo` to prevent unnecessary re-renders when parent state changes. This is especially impactful for components rendered in lists or multiple times on a page.
