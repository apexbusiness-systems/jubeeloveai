## 2024-11-20 - [ARIA Labels on Buttons]
**Learning:** Adding redundant `aria-label` attributes to buttons when they exactly match the text node content is unnecessary for screen readers (e.g., `aria-label="Return to Home"` when the button text is "Return to Home").
**Action:** Only add `aria-label` when the visible text is absent (like icon-only buttons) or insufficient/ambiguous for a screen reader user.
