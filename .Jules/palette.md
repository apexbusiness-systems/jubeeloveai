
## 2025-04-07 - Add ARIA Labels to Icon-Only Action Buttons
**Learning:** Interactive cards with multiple icon-only actions (like Download/Delete) are entirely opaque to screen readers if the icons lack aria-labels, breaking the core task flow for visually impaired users.
**Action:** Always ensure icon-only utility buttons within mapped items receive specific, contextual aria-labels using properties of the current item.
## 2025-04-07 - Add ARIA Labels to Slider Thumb Components\n**Learning:** The Slider component from Radix UI needs explicit aria-label passing to the `SliderPrimitive.Thumb` component so that screen readers can announce what the slider controls.\n**Action:** Passed `props['aria-label']` to `SliderPrimitive.Thumb` in the wrapper and added descriptive aria-labels to instances of the Slider component.
