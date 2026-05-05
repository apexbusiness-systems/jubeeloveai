## $(date +%Y-%m-%d) - [ARIA Label Consistency]
**Learning:** Found multiple interactive elements (buttons, inputs) in `VoiceSelector`, `JubeePersonalization`, and `FeedbackWidget` lacking proper screen reader support. Icon-only cards often act as buttons.
**Action:** Always ensure large interactive cards acting as buttons or interactive textareas without explicit text labels have descriptive `aria-label`s.
