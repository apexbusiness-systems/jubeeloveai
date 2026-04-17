## 2024-04-13 - Add ARIA label to dismiss banner button
**Learning:** Found an icon-only button without an `aria-label` attribute (`src/pages/Home.tsx`). Screen readers wouldn't know what "✕" means in this context.
**Action:** Adding an `aria-label` attribute on icon-only buttons greatly improves accessibility for screen readers. Added `aria-label="Dismiss install banner"` to the button.

## 2024-04-14 - Add ARIA labels to dance minigame controls
**Learning:** Found icon-only buttons without an `aria-label` attribute in the JubeeDance minigame (`src/modules/dance/JubeeDance.tsx`). Screen readers wouldn't know what the Home, Pause, and Resume icons mean in this context.
**Action:** Adding an `aria-label` attribute on icon-only buttons greatly improves accessibility for screen readers. Added `aria-label="Back to menu"`, `aria-label="Pause game"`, and `aria-label="Resume game"` to the corresponding buttons.
## 2024-04-17 - Added Descriptive ARIA Labels to MemoryCard
**Learning:** For components that represent a dynamic state (like a memory game card), `aria-label` shouldn't just be static. By dynamically interpolating the card's position (using its map index) and its visibility state (`flipped showing ${emoji}`, `matched showing ${emoji}`, or `unflipped`), screen reader users get a much more immersive and understandable experience equivalent to the visual state changes.
**Action:** When working on interactive games or grids, always pass down an index or coordinate to components so their ARIA labels can provide positional context alongside state context.
