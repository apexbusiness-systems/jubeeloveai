## 2024-04-18 - Missing ARIA label in Error Boundary Recovery Button
**Learning:** Error boundaries often contain dynamically rendered recovery buttons that lack context when read by screen readers. A plain "Try Again" is not informative enough out of context.
**Action:** Always ensure that dynamically rendered fallback UI components, especially recovery actions in error boundaries, have descriptive `aria-label` attributes explaining exactly what the button tries to recover.

## 2024-04-21 - Missing ARIA label in Story Time Component
**Learning:** Custom interactive components like story cards and navigation buttons need clear, context-aware `aria-label`s. E.g., a "Next" button might mean "Finish" depending on the state, so the `aria-label` should reflect that dynamically.
**Action:** Always provide `aria-label`s on dynamically rendered elements like story pages and navigation buttons, making sure the labels match the dynamic state of the component.

## 2024-04-22 - Missing Tooltips on Icon-Only Buttons
**Learning:** Icon-only buttons (like the personalize '🎨' and voice '🔊' buttons) often lack visual context. While `aria-label` provides context for screen readers, sighted users who hover with a mouse do not see it.
**Action:** Always provide `title` attributes on icon-only buttons to ensure standard browser tooltips appear on hover, and use the design system's `<Button size="icon">` to ensure correct `focus-visible` styling for keyboard users.

## 2024-04-24 - Make interactive Card elements accessible buttons
**Learning:** Found an accessibility issue pattern where `Card` components from the design system are used as interactive elements with just an `onClick` handler, making them completely inaccessible to keyboard and screen reader users.
**Action:** Next time I see a Card used for navigation or selection, ensure it has `role="button"`, `tabIndex={0}`, keyboard event handlers (`onKeyDown` for Enter/Space), appropriate focus styling, and an `aria-label`.
## 2024-05-08 - Added `aria-hidden="true"` to decorative icons in VolumeControlDialog
**Learning:** Decorative icons in dialogs and buttons should be hidden from screen readers to prevent redundant reading.
**Action:** Add `aria-hidden="true"` to decorative icons in VolumeControlDialog.

## 2024-05-14 - Make visual collection cards keyboard accessible
**Learning:** Visual collection items like Sticker Cards that only have a visual UI and an `aria-label` but no interactive behavior (like `onClick`) are completely skipped by keyboard navigation. Users navigating via keyboard cannot read the `aria-label` description.
**Action:** Add `tabIndex={0}` and `focus-visible` styling to visual collection items so they receive focus during keyboard navigation, allowing screen readers to announce their `aria-label`. Include all necessary context in the `aria-label` (e.g. sticker description, not just name).
## 2024-05-23 - Hide decorative icons in VoiceCommandButton
**Learning:** Decorative icons inside buttons that already have `aria-label` or `title` should be hidden from screen readers.
**Action:** Added `aria-hidden="true"` to `Loader2`, `MicOff`, and `Mic` icons in `VoiceCommandButton.tsx`.
## 2026-06-06 - Prevent Empty Form Submissions via State
**Learning:** Post-click error toasts (like 'Please enter your feedback') add unnecessary friction. It's much better UX to visually disable the primary action until the form is in a valid state (e.g. `!feedback.trim()`), providing immediate feedback. Adding a character counter and `maxLength` further clarifies expectations.
**Action:** Always map primary submit button `disabled` state to form validity rather than handling empty states in the submit handler.
