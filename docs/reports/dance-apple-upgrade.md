# Dance Apple-Grade Upgrade Plan

Date: 2026-02-07 (America/Edmonton)

## Acceptance Checklist
- Deterministic timing tied to audio playback time via BeeSync (no Date.now deltas for judgments).
- Pause/resume produces zero drift; song time halts during pause and resumes correctly.
- Single countdown source of truth (visual + audio synchronized), no duplicate countdown logic.
- StepZone highway renders smoothly with lookahead window 2500–3500ms and GPU-friendly transforms.
- StepZone runs without full-app rerenders (lane-only RAF or ref-based transforms).
- Arrow UI uses design tokens (primary/accent/game) with cohesive palette; no random neon.
- ThumbPad arrow buttons: 44px+ (prefer 64px), aria-labels, focus-visible rings, keyboard safe.
- HoneyGlass visual layer applied under `.jubee-dance` with glass surfaces, soft borders, layered shadows.
- StageLight: frame-time based 3D loop, pauses when hidden/offscreen/paused, pixel ratio capped at 2.
- StageLight adds key/fill/rim lighting + subtle, low-cost sparkle burst for perfect hits.
- ChimeKit: local WebAudio by default; remote SFX only with `VITE_DANCE_SFX_REMOTE=1`.
- Haptics: perfect/good/miss patterns, disabled when prefers-reduced-motion.
- ReplayLoop results view: star rating (1–3), grade, accuracy breakdown, play again / next song, party mode default OFF.
- No new npm dependencies; no new network calls in kid gameplay by default.
- Typecheck, lint, tests, and build all pass.

## Performance Targets
- Note highway animates at 60fps without forcing full-app rerenders.
- Pause/resume causes zero “note eating” and no time drift.
- 3D loop pauses when hidden/offscreen/paused and caps pixel ratio at 2.
- Mobile tap targets >= 44px; prefer 64px.

## Test Plan
- Unit: `DanceGameFSM` perfect/good/miss timing windows and early-input ignored.
- Unit: pause/resume does not drift (songTimeMs stable when paused; judgments unaffected).
- Unit: missed-note detection stable and does not advance during pause.
- Render: Arrow buttons and StepZone expose aria-labels for directions.
- Render: focus-visible ring class present for arrow buttons (where feasible).
- Manual: verify StepZone FPS/stutter, combo counter milestone animation, pause/resume correctness,
  and reduced-motion behavior (no flashy effects/haptics).
