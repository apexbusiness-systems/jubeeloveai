## 2024-04-18 - Missing ARIA label in Error Boundary Recovery Button
**Learning:** Error boundaries often contain dynamically rendered recovery buttons that lack context when read by screen readers. A plain "Try Again" is not informative enough out of context.
**Action:** Always ensure that dynamically rendered fallback UI components, especially recovery actions in error boundaries, have descriptive `aria-label` attributes explaining exactly what the button tries to recover.

## 2024-04-21 - Missing ARIA label in Story Time Component
**Learning:** Custom interactive components like story cards and navigation buttons need clear, context-aware `aria-label`s. E.g., a "Next" button might mean "Finish" depending on the state, so the `aria-label` should reflect that dynamically.
**Action:** Always provide `aria-label`s on dynamically rendered elements like story pages and navigation buttons, making sure the labels match the dynamic state of the component.

## 2024-04-22 - Missing Tooltips on Icon-Only Buttons
**Learning:** Icon-only buttons (like the personalize '🎨' and voice '🔊' buttons) often lack visual context. While `aria-label` provides context for screen readers, sighted users who hover with a mouse do not see it.
**Action:** Always provide `title` attributes on icon-only buttons to ensure standard browser tooltips appear on hover, and use the design system's `<Button size="icon">` to ensure correct `focus-visible` styling for keyboard users.
