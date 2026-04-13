## 2024-04-13 - Add ARIA label to dismiss banner button
**Learning:** Found an icon-only button without an `aria-label` attribute (`src/pages/Home.tsx`). Screen readers wouldn't know what "✕" means in this context.
**Action:** Adding an `aria-label` attribute on icon-only buttons greatly improves accessibility for screen readers. Added `aria-label="Dismiss install banner"` to the button.
