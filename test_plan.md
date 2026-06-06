1. **Identify Bottleneck**: Multiple individual `useStore` hooks are being called in `usePageVisitTracker`, `useGameProgressAutoSave`, and `useAchievementTracker`. This creates multiple subscriptions to the Zustand stores, which can cause unnecessary re-evaluations and memory overhead.
2. **Implement Fix**: Group these into single `useStore` calls using `useShallow`.
3. **Verify**: Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, `bun run build`. (Note: user requests 'npm run armageddon' per apex-dev, let's see if that script exists).
