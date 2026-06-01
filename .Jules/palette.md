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
## 2024-05-19 - Added aria-hidden to decorative icons
**Learning:** Decorative icons next to text or large centerpiece icons shouldn't be read out by screen readers since they provide no extra context.
**Action:** Next time I see a decorative icon, add `aria-hidden="true"` to it.
## 2024-05-19 - WCAG 2.5.3 Label in Name violation
**Learning:** Adding `aria-label` to a button that already has visible text inside can cause a WCAG 2.5.3 (Label in Name) violation if the aria-label doesn't contain the visible text, breaking voice controls.
**Action:** Only add `aria-label` to icon-only buttons or ensure the label includes the visible text.

## 2024-05-27 - Child Selector Button Accessibility
**Learning:** Found a dynamic button in `NavigationHeader` that changes its text based on state ("Select Child" or child's name) but lacked an `aria-label` and `title` to provide clear context to screen readers and mouse users. Added dynamic `aria-label` and `title` that explain the button's action and current state.
**Action:** When buttons have dynamic text content (like a selected user name), always add a descriptive `aria-label` that clarifies the action ("Switch child profile") alongside the current state.

## 2024-05-29 - Missing Focus Indicators on Interactive Elements
**Learning:** Custom interactive elements (like game cards or story buttons) that use `<button>` or `<div>` with `onClick` often lack visual feedback for keyboard navigation, making them inaccessible to keyboard users.
**Action:** Always add `focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2` (or appropriate ring sizing) to custom interactive elements to ensure they have clear focus states.

## 2025-05-30 - Added Keyboard Focus States
**Learning:** Some custom interactive elements (like the 'TabButton' component in the bottom navigation and the manual 'dismiss' button for the install banner) lacked explicit focus rings. By default, Tailwind CSS combined with custom components doesn't always provide sufficient focus indicators for keyboard users.
**Action:** Always verify keyboard focus states (`focus-visible`) for any custom button or interactive element that isn't a standard HTML `<button>` or lacks default browser styles. Use `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2` for consistent, accessible focus indicators.
