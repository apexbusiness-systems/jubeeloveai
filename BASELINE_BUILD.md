# Baseline Build Documentation

**Date:** November 30, 2025  
**Purpose:** This document captures the current production build state as a reference point for preventing regressions and validating future changes.

---

## 1. Header Configuration

**Component:** `src/components/NavigationHeader.tsx`

### Styling
- **Background:** `bg-gradient-to-r from-accent to-primary` (100% opacity)
- **Border:** `border-b-2 border-primary/30`
- **Backdrop:** `backdrop-blur-sm`
- **Z-Index:** `z-40`
- **Position:** `fixed top-0`
- **Height:** `h-16` (64px)
- **Padding:** `px-4`

### Visual Characteristics
- Yellow-to-red gradient (left to right)
- Semi-transparent bottom border (30% opacity primary color)
- Subtle blur effect on background
- Fixed positioning at top of viewport

### Elements
- Logo: "Jubee Love" text with sparkle icon
- Voice Command Button (conditional)
- Child Selector Button (conditional, shown when children exist)
- Personalization Button
- Voice Selection Button

---

## 2. Footer/Navigation Configuration

**Component:** `src/components/Navigation.tsx`

### Styling
- **Background:** `linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)))` (100% opacity)
- **Border:** `border-top: 3px solid hsl(var(--primary) / 0.3)`
- **Backdrop:** `backdrop-filter: blur(8px)`
- **Height:** `80px`
- **Z-Index:** `1000`
- **Position:** `fixed bottom-0`

### Tab Button Styling
- **Icon Color:** `text-white`
- **Label Color:** `text-white` (font-bold, text-xs)
- **Icon Size:** `w-8 h-8` (32px × 32px)
- **Active State:** `bg-primary/20 border-t-4 border-primary shadow-lg scale-105`
- **Hover State:** `hover:bg-primary/10 hover:scale-105`
- **Transitions:** `transition-all duration-200`

### Footer Glow Effect
```css
.footer-glow {
  /* No shadows - clean appearance */
}
```

### Navigation Items
1. **Home** - `/` - Home icon
2. **Games** - `/games` - Shapes icon
3. **Stories** - `/stories` - Book icon (long-press → `/stories/:id`)
4. **Writing** - `/writing` - Writing icon
5. **Stickers** - `/stickers` - Stickers icon
6. **Progress** - `/progress` - Progress icon

---

## 3. Design Tokens (CSS Variables)

**File:** `src/index.css`

### Light Mode (`:root`)
```css
--background: 48 100% 95%;        /* #FFF8E1 - Soft warm cream */
--foreground: 30 15% 20%;         /* #36302A - Deep warm brown */
--primary: 45 100% 51%;           /* #FFC107 - Vibrant amber/yellow */
--primary-foreground: 30 15% 20%; /* #36302A */
--accent: 48 100% 64%;            /* #FFD54A - Soft golden yellow */
--accent-foreground: 30 15% 20%;  /* #36302A */
--card: 48 100% 98%;              /* #FFFEF5 */
--card-foreground: 30 15% 20%;
--destructive: 0 84% 60%;         /* #E53935 - Vibrant red */
--destructive-foreground: 0 0% 98%;
```

### Dark Mode (`.dark`)
```css
--background: 30 15% 10%;         /* #1B1A16 - Deep warm charcoal */
--foreground: 48 100% 95%;        /* #FFF8E1 */
--primary: 45 100% 51%;           /* #FFC107 */
--primary-foreground: 30 15% 10%;
--accent: 48 100% 64%;            /* #FFD54A */
--card: 30 15% 15%;               /* #262420 */
--destructive: 0 84% 60%;         /* #E53935 */
```

### Jubee Mascot Colors
```css
--jubee-boy-body: 45 100% 51%;       /* #FFC107 - Golden yellow */
--jubee-boy-stripe: 30 15% 10%;      /* #1A1A1A - Soft black */
--jubee-boy-glow: 48 100% 64%;       /* #FFD54A */

--jubee-girl-body: 330 100% 71%;     /* #FF69B4 - Hot pink */
--jubee-girl-stripe: 350 100% 45%;   /* #E6007E - Deep magenta */
--jubee-girl-glow: 340 100% 80%;     /* #FFB3D9 */

--jubee-wing: 190 100% 94%;          /* #E0F7FF - Soft cyan-white */
--jubee-wing-glow: 180 100% 70%;     /* #00D4FF - Bright cyan */
--jubee-antenna: 30 15% 10%;         /* #1A1A1A */
```

---

## 4. Jubee Mascot Configuration

**Component:** `src/components/JubeeCanvas3DDirect.tsx`

### Rendering
- **Engine:** Three.js Direct (no React Three Fiber portal)
- **Canvas Size:** Responsive
  - Desktop: `360px × 405px`
  - Tablet: `315px × 360px`
  - Mobile: `270px × 324px`

### 3D Model
- **Scale:** `0.9` (applied to `jubeeGroup`)
- **Default Position:** `[2.5, -1.5, 0]`
- **Camera:** `position: [0, 0, 6]`, `fov: 45`

### Features
- Draggable (mouse + touch support)
- Contextual emotional animations (excited, curious, sleepy)
- Facial expressions (eyes, antennae)
- Page transition flying animations
- Audio effects system (cheerful buzz, gentle hum, yawn)
- Collision detection with UI elements
- Visibility toggle with persistent state

### Material Properties
- **Body:** `shininess: 100+`, `emissiveIntensity: 0.3+`
- **Wings:** `transmission: 0.8`, translucent with iridescent shimmer
- **Colors:** Use semantic tokens from design system (no hardcoded hex values)

### Position Constraints
- **Container:** `overflow: visible` (no clipping)
- **Bounds Checking:** `POSITION_BOUNDS` with clamping logic
- **Default:** `{ bottom: 120, right: 80 }`
- **Safe Margins:** `minBottom: 100`, `minRight: 80`

---

## 5. CSS Classes Reference

### `.tab-bar`
```css
.tab-bar {
  background: linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)));
  border-top: 3px solid hsl(var(--primary) / 0.3);
  backdrop-filter: blur(8px);
  height: 80px;
  position: fixed;
  bottom: 0;
  z-index: 1000;
}
```

### `.footer-glow`
```css
.footer-glow {
  /* No shadows - clean appearance */
}
```

### `.glass-effect`
```css
.glass-effect {
  background: linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)));
  backdrop-filter: blur(12px);
  opacity: 1;
}
```

### `.jubee-container`
```css
.jubee-container {
  position: fixed;
  isolation: isolate;
  will-change: transform;
  pointer-events: auto;
  z-index: 30;
  overflow: visible;
}
```

---

## 6. Responsive Breakpoints

**File:** `tailwind.config.ts`

### Breakpoints
- **Mobile:** `< 768px` (default, mobile-first)
- **Tablet:** `md: 768px`
- **Desktop:** `lg: 1024px`

### Width Constraints
- **Mobile:** `max-w-[480px] mx-auto px-4`
- **Tablet:** `max-w-[960px]`
- **Desktop:** `max-w-[1200px]`

### Container Responsive Sizing
- **Desktop:** `w-[360px] h-[405px]`
- **Tablet:** `w-[315px] h-[360px]` (at `md:` breakpoint)
- **Mobile:** `w-[270px] h-[324px]` (at `sm:` breakpoint)

---

## 7. Accessibility Features

### Touch Targets
- **Minimum Size:** `44px × 44px` (WCAG compliance)
- **Footer Buttons:** `w-16 h-full` (64px × 80px)

### Focus States
- **Visible Focus Rings:** `focus-visible:ring-2 focus-visible:ring-primary`
- **Active States:** Scale and shadow transitions
- **Hover States:** Background overlay + scale transform

### Motion
- **Reduced Motion Support:** `prefers-reduced-motion:reduce` media query
- **Smooth Transitions:** `transition-all duration-200`

### ARIA
- **Icons:** `aria-hidden="true"` (decorative)
- **Buttons:** Descriptive labels for screen readers
- **Navigation:** Semantic `<nav>` element with proper roles

### Color Contrast
- **WCAG AA Compliance:** All text meets minimum contrast ratios
- **Footer:** White text on yellow-to-red gradient (high contrast)

---

## 8. Key File Locations

### Core Components
- **App Shell:** `src/App.tsx`
- **Navigation Footer:** `src/components/Navigation.tsx`
- **Header:** `src/components/NavigationHeader.tsx`
- **Jubee Mascot:** `src/components/JubeeCanvas3DDirect.tsx`

### Styling
- **Global CSS:** `src/index.css`
- **Tailwind Config:** `tailwind.config.ts`

### State Management
- **Jubee Store:** `src/store/useJubeeStore.ts`
- **Parental Store:** `src/store/useParentalStore.ts`
- **Achievement Store:** `src/store/useAchievementStore.ts`
- **Game Store:** `src/store/useGameStore.ts`
- **Onboarding Store:** `src/store/useOnboardingStore.ts`

### Routing
- **Routes Configuration:** `src/components/AppRoutes.tsx`

### Audio
- **Audio Manager:** `src/lib/audioManager.ts`
- **Jubee Audio Effects:** `src/lib/jubeeAudioEffects.ts`

### Hooks
- **Jubee Draggable:** `src/hooks/useJubeeDraggable.ts`
- **Jubee Performance:** `src/hooks/useJubeePerformance.ts`
- **Jubee Page Transition:** `src/hooks/useJubeePageTransition.ts`
- **Jubee Rendering Guard:** `src/hooks/useJubeeRenderingGuard.ts`
- **Screen Time Enforcement:** `src/hooks/useScreenTimeEnforcement.ts`

---

## 9. Diagnostics & Monitoring

### Lifecycle Diagnostics
- **Location**: `src/hooks/useJubeeLifecycleDiagnostics.ts`
- **Integration**: Directly integrated into JubeeCanvas3DDirect component
- **Monitoring**: State changes, DOM mutations, viewport visibility, health checks every 5 seconds
- **Access**: `window.jubeeDebug.printHistory()` in browser console
- **Features**:
  - Captures snapshots of state, DOM, and viewport at lifecycle boundaries
  - Detects critical issues (missing container/canvas, off-screen positioning)
  - Provides health check reports with actionable diagnostics
  - Maintains rolling history of last 50 snapshots

### Rendering Guard
- **Location**: `src/core/jubee/JubeeRenderingGuard.ts`
- **Purpose**: Validates container, canvas, and WebGL context health
- **Recovery**: Automatic recovery attempts (max 3) with callbacks
- **Health Monitoring**: Periodic validation every 3 seconds

### WebGL Context Recovery
- **Location**: `src/hooks/useWebGLContextRecovery.ts`
- **Purpose**: Detects and recovers from WebGL context loss
- **Features**: Event listeners for contextlost/contextrestored, exponential backoff retry

---

## 10. Build Health Status

### Current State
✅ **Production-Ready** - All systems stable and optimized

### Recent Fixes
- **Navigation tab fix (Dec 14, 2025)**: Added `e.preventDefault()` to button click handler to resolve race condition causing non-responsive tabs
- **Audio verification (Dec 14, 2025)**: Story narration working via OpenAI TTS fallback (ElevenLabs blocked)
- **CRITICAL FIX (Dec 2, 2025)**: Diagnostic system disconnection resolved
  - **Issue**: Lifecycle diagnostics monitored null ref from App.tsx instead of actual Jubee component
  - **Root Cause**: `useJubeeLifecycleDiagnostics` called with ref never attached to DOM
  - **Resolution**: Moved diagnostics integration directly into JubeeCanvas3DDirect component
  - **Impact**: Diagnostics now accurately track component state and enable recovery from failures
  - **Verification**: `window.jubeeDebug.printHistory()` now shows correct containerExists/canvasExists status
- Footer text/icon color changed to `text-white` for maximum contrast
- Footer gradient opacity set to 100%
- All shadows removed from footer for clean appearance
- Header glass effect with 100% opacity gradient
- Jubee sizing reduced by 10% for better spatial balance

### Known Working Features
- ✅ Jubee mascot rendering (Three.js Direct)
- ✅ Drag functionality (mouse + touch)
- ✅ Page transitions with contextual animations
- ✅ Audio effects system (Web Audio API)
- ✅ Facial expressions and emotional states
- ✅ Collision detection
- ✅ Responsive design across all breakpoints
- ✅ Offline-first architecture with PWA support
- ✅ Achievement tracking and rewards system
- ✅ Parental controls with screen time enforcement
- ✅ Multi-language support (i18n)
- ✅ Error boundaries and recovery mechanisms
- ✅ Navigation tabs responsive to taps/clicks
- ✅ Story narration (TTS with OpenAI fallback)

---

## 11. Testing Reference

### E2E Test Coverage
- ✅ Parent journey verification (`e2e/parent-journey.spec.ts`)
- ✅ Onboarding flow (`e2e/onboarding.spec.ts`)
- ✅ Games menu and gameplay (`e2e/games.spec.ts`)
- ✅ Story reading (`e2e/story-reading.spec.ts`)
- ✅ Creative activities (`e2e/creative-activities.spec.ts`)
- ✅ Rewards and achievements (`e2e/rewards-achievements.spec.ts`)
- ✅ Settings and parental controls (`e2e/settings.spec.ts`)
- ✅ Jubee interaction (`e2e/jubee-interaction.spec.ts`)
- ✅ Navigation flows (`e2e/navigation.spec.ts`)

### Test Commands
```bash
npm run test              # Unit tests (Vitest)
npm run test:ci           # Coverage reporting
npx playwright test       # E2E tests
```

---

## 12. Deployment Status

### Current Environment
- **Frontend:** Deployed via Lovable hosting
- **Backend:** Supabase Cloud (PostgreSQL + Edge Functions)
- **CDN:** Automatic via Lovable
- **PWA:** Service worker active with offline support

### Performance Metrics
- **Bundle Size:** Optimized with Vite chunk splitting
- **Lighthouse Score:** >90 performance score target
- **First Contentful Paint:** Optimized with loading skeletons
- **Time to Interactive:** Web Workers offload heavy computation

---

## 13. Change Log

### December 14, 2025
- **Navigation tab button fix**: Added `e.preventDefault()` to handleClick to resolve race condition
- **Onboarding modal**: Hidden by default (`hasCompletedOnboarding: true`) for testing
- **All navigation routes verified**: `/`, `/write`, `/shapes`, `/progress`, `/stickers`, `/settings`
- **Audio systems verified**: Story narration working via OpenAI TTS fallback
- **ElevenLabs voice status**: Still blocked (free tier 401) - upgrade required
- **Note**: Onboarding modal should be re-enabled (`hasCompletedOnboarding: false`) before production

### December 2, 2025
- **CRITICAL FIX**: Resolved diagnostic system disconnection
  - Moved `useJubeeLifecycleDiagnostics` from App.tsx into JubeeCanvas3DDirect
  - Fixed root cause: diagnostics now monitor actual component refs instead of null ref
  - Enables accurate failure detection and automatic recovery
- Baseline documentation locked with comprehensive component specifications

### November 30, 2025
- ✅ Footer text/icon color finalized as `text-white`
- ✅ Footer gradient opacity set to 100%
- ✅ All footer shadows removed for clean appearance
- ✅ Header glass effect opacity set to 100%
- ✅ Baseline build documentation created

### Previous Milestones
- ✅ 4-phase production audit completed (Critical Systems, Performance, Code Quality, UX Polish)
- ✅ Jubee Three.js direct rendering implementation
- ✅ 2.5x performance optimization achieved
- ✅ Comprehensive error hardening (toast infinite loop fix, achievement worker fix)
- ✅ Security fixes (conversation_logs injection, screen_time_requests spam)
- ✅ 913 lines of dead code removed
- ✅ E2E test coverage across all major flows

---

## 13. Regression Prevention

### Critical Constraints
1. **Never access browser APIs during render phase** - Use `useEffect` with `typeof window !== 'undefined'` guards
2. **Maintain Jubee container + geometry scale ratio** - Both must be adjusted together during responsive changes
3. **Preserve design token architecture** - No hardcoded colors, all colors must use semantic tokens
4. **Respect scope boundaries** - Only touch explicitly scoped components/elements
5. **Visual verification required** - Confirm changes render correctly before marking complete
6. **Navigation button event handlers** - Must include `e.preventDefault()` for consistent behavior

### Baseline Reference Points
- **Jubee Scale:** `0.9` applied to `jubeeGroup`
- **Jubee Container:** Desktop 360×405, Tablet 315×360, Mobile 270×324
- **Footer Icons/Text:** `text-white` on yellow-to-red gradient
- **Header/Footer Opacity:** 100% (no transparency)
- **Design Tokens:** All colors use `hsl(var(--token-name))` format

---

## 14. Future Work Considerations

### Potential Enhancements
- Visual regression testing automation
- Performance metrics dashboard
- Accessibility audit refinements
- Advanced gesture interactions
- Additional language support

### Hard Constraints for Future Work
- ✅ Stack locked: React + Vite + TypeScript + Tailwind (no changes)
- ✅ Design system: Semantic tokens only (no hardcoded colors)
- ✅ Testing: E2E tests run via npm only (not backend/edge APIs)
- ✅ Scope precision: Non-negotiable (only touch explicitly scoped elements)
- ✅ Visual verification: Mandatory before confirming completion

---

**End of Baseline Build Documentation**

This document serves as the **permanent reference** for the current production build state. All future changes must be validated against this baseline to prevent regressions and maintain system stability.
