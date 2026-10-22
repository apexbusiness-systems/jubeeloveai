1. **Scope/Goal**: Group multiple separate Zustand store selectors into a single `useShallow` object to reduce store subscriptions and prevent unnecessary re-renders in `FeelingsGame.tsx` and `ColorGame.tsx`.
2. **Context**: In `.jules/bolt.md`, we identified that multiple individual Zustand selectors inside React components cause excessive re-renders due to multiple store subscriptions. We will apply this optimization for `FeelingsGame.tsx` and `ColorGame.tsx`.
3. **Plan**:
   - `src/modules/games/ColorGame.tsx`: Group `speak` and `triggerAnimation` from `useJubeeStore`.
   - `src/modules/feelings/FeelingsGame.tsx`: Group `speak` and `triggerAnimation` (if exists) from `useJubeeStore`. Group `journal`, `totalCorrect`, `totalPlayed` from `useFeelingsStore`. Group `speak` from `useJubeeStore` in `SelfReport` and other sub-components if applicable, or pass them down.
4. **Pre-commit**: Complete pre-commit steps to ensure tests, format, and lint pass.
5. **Verify & Ship**: Check that the build still works, run tests, and create PR/commit.
