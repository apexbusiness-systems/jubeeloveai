1. **Identify the UX/Accessibility issue**: In `src/pages/ParentalControls.tsx`, there are inputs and switches missing standard explicit label associations (using `htmlFor` and `id`). Specifically:
   - `<Label>Daily Time Limit (minutes)</Label>` has an `<Input>` next to it, but they are not linked.
   - `<Label>Default Daily Limit (minutes)</Label>` has an `<Input>` next to it, but they are not linked.
   - `<Label>PIN Protection</Label>` has a `<Switch>` next to it, but they are not linked.
   - `<Label>Require PIN for Settings</Label>` has a `<Switch>` next to it, but they are not linked.
2. **Link the components**:
   - Add `id="daily-limit-${child.id}"` to the daily time limit `Input` and `htmlFor="daily-limit-${child.id}"` to the `Label`.
   - Add `id="default-daily-limit"` to the default daily time limit `Input` and `htmlFor="default-daily-limit"` to the `Label`.
   - Add `id="pin-protection-switch"` to the PIN Protection `Switch` and `htmlFor="pin-protection-switch"` to the `Label`.
   - Add `id="require-pin-switch"` to the Require PIN for Settings `Switch` and `htmlFor="require-pin-switch"` to the `Label`.
3. **Verify Changes**: Ensure no syntax errors and that the code compiles.
4. **Pre-commit checks**: Run `pnpm lint` and `pnpm test` (or `bun run test` per the instructions for this repo) and ensure they pass.
