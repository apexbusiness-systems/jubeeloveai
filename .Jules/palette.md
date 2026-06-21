## YYYY-MM-DD - [Aria label on buttons with text]
**Learning:** Adding an `aria-label` to a button that already has visible text overwrites the visible text. This is an accessibility anti-pattern because voice dictation users saying "Click [Visible Text]" will fail if the programmatic accessible name has been changed. Only use `aria-label` for icon-only buttons.
**Action:** When improving UX for buttons with text, rely on properties like `title` for hover-over tooltips rather than overwriting accessibility name via `aria-label`.
