
# JubeeDance Premium Revamp Plan

## Current State Assessment

The dance game has solid bones: FSM-driven state, DanceClock for audio sync, 3D Three.js character, StepZone DDR highway, ComboCounter with confetti, and 22 songs. However, the UI/UX and 3D rendering are functional-grade, not Apple-grade. Key gaps:

- **3D Engine**: Low-poly character (32 segments), basic MeshStandardMaterial, no environment mapping, no bloom/glow post-processing, static stage, no dynamic lighting reactions to beats
- **UI**: Generic card-based song picker, plain results screen, no progress bars during gameplay, no animated transitions between game phases, thumbpad is functional but not premium
- **UX**: No difficulty progression indicator, no visual rhythm guide, countdown is plain text on black, no beat-pulse visual feedback, no particle trails on notes

## What Apple-Grade Means Here

Apple's design standards for interactive experiences emphasize: depth through layered translucency, purposeful motion with spring physics, haptic-visual synchronization, generous whitespace, consistent radius/shadow system, and micro-interactions that feel alive. Every element should have weight, respond to input with physicality, and transition with intention.

---

## Plan (7 focused tasks)

### 1. Upgrade 3D Character Rendering Quality
**DanceCharacter.tsx** overhaul:
- Increase geometry segments (32→64 for body/head, 16→32 for eyes/wings)
- Replace MeshStandardMaterial with MeshPhysicalMaterial for body (clearcoat, iridescence for wings)
- Add environment map (RoomEnvironment from drei-style approach via PMREMGenerator) for realistic reflections
- Add bloom-like glow ring around character during perfect streaks using emissive materials
- Animate eye blinks (periodic pupil scale), antenna bounce (spring physics), and mouth changes (happy→open on celebrate)
- Add dynamic stage spotlight that changes color with combo tier (warm→fire→legendary colors)
- Shadow map resolution 512→1024, add contact shadows via a ground plane with opacity gradient
- Add beat-pulse: scale body slightly on each beat interval using BPM from current song

### 2. Revamp Song Selection Menu
**JubeeDance.tsx** menu view:
- Replace flat card grid with a horizontal scrollable carousel (embla-carousel-react already installed)
- Each song card becomes a "vinyl record" style card: large emoji centered, gradient background per song, glassmorphism overlay
- Selected card scales up with spring animation and shows a glowing ring
- Add animated waveform/equalizer bars (CSS-only) below selected song preview
- Song difficulty shown as colored dots (green/yellow/red) instead of text badges
- Add a "Now Playing" mini-preview with 3D character doing idle dance when song is selected
- Section headers with subtle gradient text and decorative sparkle icons

### 3. Redesign Playing View HUD
**JubeeDance.tsx** playing view:
- Replace plain score text with a pill-shaped score counter that pulses on score change
- Add a song progress bar (thin, gradient, bottom of stage area) showing elapsed/total time
- Floating lyric display with frosted glass background and karaoke-style word highlighting
- Hit feedback ("PERFECT!", "GOOD!", "Oops!") redesigned as stacked text with glow shadow and scale-rotate entrance
- Pause overlay becomes a frosted fullscreen sheet with blurred game behind it, centered play button with ring animation

### 4. Upgrade StepZone and Note Rendering
**ArrowDisplay.tsx** and CSS:
- Notes get a trailing glow/comet tail effect (CSS gradient pseudo-element behind each note)
- Receptor zone pulses on beat (scale animation synced to BPM)
- Lane backgrounds shift gradient intensity as notes approach
- Perfect hit on receptor triggers a ring-expand burst animation (CSS keyframe)
- Note size increases slightly as it approaches receptor (proximity scaling)
- Arrow glyphs get a subtle inner shadow for depth

### 5. Upgrade ThumbPad Controls
**ArrowDisplay.tsx** ArrowButtons:
- Increase button size to 72px on mobile (from 64px) with 20px radius
- Add press-down 3D effect: inner shadow swap on :active, scale(0.92) + brightness filter
- Each button gets a subtle colored glow matching its direction color
- Add a center hub circle (decorative) connecting the d-pad
- Haptic feedback pattern varies by direction (already partially done, enhance timing)

### 6. Premium Countdown and Results Screen
**JubeeDance.tsx** countdown + results:
- Countdown: large number with concentric ring expansion, gradient text, stage lights dim then brighten on "Go!"
- Results screen: animated star reveal (each star flies in with spring + rotation), score counter animates up from 0 to final
- Accuracy breakdown bars become animated gradient progress bars that fill on mount
- Add a "New High Score!" badge if applicable (compare to stored best)
- Confetti burst on 3-star results

### 7. CSS Polish and Design Token Refinement
**index.css** dance section:
- Add new CSS custom properties for note-trail gradient, beat-pulse scale, stage spotlight colors
- Receptor pulse keyframe synced to `--dance-bpm` custom property
- Note trail pseudo-element with gradient fade
- Refined glassmorphism with noise texture overlay (CSS radial-gradient trick)
- All shadows use consistent 3-layer depth system (ambient + key + accent)
- Add `@supports (backdrop-filter: blur())` fallback for older browsers

---

## Technical Constraints
- All changes stay within React + Vite + TypeScript + Tailwind + Three.js direct rendering
- No new dependencies needed (embla-carousel-react, framer-motion, canvas-confetti all already installed)
- prefers-reduced-motion fully respected throughout
- Touch targets remain ≥44px minimum, increased to 72px for thumbpad
- All hardcoded colors use semantic design tokens per project constraint
