## 2024-09-06 - [Added Password Visibility Toggle]
**Learning:** Password visibility toggles are an essential micro-UX enhancement for authentication forms. By placing the toggle button absolutely within a relative container, wrapping the input and providing proper `aria-label`s, we ensure keyboard accessibility without breaking the layout.
**Action:** Always include a `type="button"` attribute to prevent the toggle from submitting the surrounding form.
