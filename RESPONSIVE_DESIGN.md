# Responsive Design Documentation

## Overview
Jubee.Love implements mobile-first responsive design with PWA optimization for touch devices and varied screen sizes.

## Breakpoint System

### Primary Breakpoints
The application uses three main breakpoints aligned with Tailwind CSS defaults:

| Breakpoint | Viewport Width | Tailwind Class | Target Devices |
|------------|---------------|----------------|----------------|
| **Mobile** | < 768px | Default (no prefix) | Phones (360px - 767px) |
| **Tablet** | 768px - 1023px | `md:` | Tablets in portrait |
| **Desktop** | ≥ 1024px | `lg:` | Tablets landscape, laptops, desktops |

### Tailwind CSS Breakpoints
Full Tailwind breakpoint system available:

```typescript
{
  sm: '640px',   // Small devices
  md: '768px',   // Tablets (PRIMARY)
  lg: '1024px',  // Desktop (PRIMARY)
  xl: '1280px',  // Large desktop
  2xl: '1536px'  // Extra large (container max: 1400px)
}
```

**Note:** While Tailwind provides `sm:` (640px), the app primarily uses mobile/tablet/desktop breakpoints at 768px and 1024px for consistency.

## Responsive Component Sizing

### Jubee Mascot Container
**🔒 LOCKED PRODUCTION BASELINE - DO NOT MODIFY WITHOUT EXPLICIT APPROVAL**

Dynamic sizing based on viewport with 10% reduction applied:

| Viewport | Container Size | 3D Model Scale | Implementation |
|----------|---------------|----------------|----------------|
| Mobile (< 768px) | **270px × 324px** | 0.9 | Compact for small screens |
| Tablet (768-1023px) | **315px × 360px** | 0.9 | Medium size |
| Desktop (≥ 1024px) | **360px × 405px** | 0.9 | Balanced size |

**Critical Scale Ratio:** 3D model geometry is scaled to `0.9` (90%) to match container size reduction, preventing visual enlargement.

**Locations:**
- Container dimensions: `src/core/jubee/JubeePositionManager.ts` - `getResponsiveContainerDimensions()`
- 3D model scale: `src/components/JubeeCanvas3DDirect.tsx` - `jubeeGroup.scale.set(0.9, 0.9, 0.9)`

**Regression Prevention:** Any changes to container dimensions MUST be accompanied by proportional 3D model scale adjustments to maintain visual consistency.

### Layout Constraints

#### Mobile (< 768px)
- **Max Width:** `max-w-[480px]` centered with `px-4` padding
- **Safe Areas:** `env(safe-area-inset-*)` for notches/home indicators
- **Touch Targets:** Minimum 44×44px for all interactive elements
- **Typography:** Base 14-16px, scale up with `sm:` classes
- **Navigation:** Bottom-fixed with 72px height + safe-area-inset

#### Tablet (768-1023px)
- **Layout:** Two-panel design (hero + sidebar/cards)
- **Touch Targets:** Minimum 44×44px maintained
- **Typography:** Scale 16-18px with medium heading sizes
- **Navigation:** Bottom-fixed, icons with labels

#### Desktop (≥ 1024px)
- **Max Width:** `max-w-[1200px]` centered grid
- **Layout:** Multi-column grids (2-3 columns)
- **Typography:** Full scale 16-20px with large headings
- **Navigation:** Full labels, hover states prominent

## Safe Area Support

### iOS and Android Safe Areas
All layouts respect device safe areas:

```css
padding-left: max(1rem, env(safe-area-inset-left));
padding-right: max(1rem, env(safe-area-inset-right));
padding-top: max(0.75rem, env(safe-area-inset-top));
padding-bottom: max(88px, calc(88px + env(safe-area-inset-bottom)));
```

**Applied to:**
- Header (`src/App.tsx` lines 185-189)
- Main content area (`src/App.tsx` lines 303-306)
- Navigation component
- Modals and overlays

## Touch Optimization

### Minimum Touch Targets
All interactive elements meet accessibility standards:

- **Buttons:** `min-h-[44px] min-w-[44px]`
- **Navigation Items:** 72px height
- **Cards:** Minimum 44px interactive zones
- **Form Controls:** 44×44px minimum

### Gesture Support
- **Tap:** Primary interaction (200-250ms transition feedback)
- **Long Press:** Hidden parent hub access (3-second hold on settings icon)
- **Drag:** Jubee mascot repositioning
- **Swipe:** Page transitions and carousel navigation

## Typography Scale

### Responsive Font Sizing
Font sizes adjust across breakpoints:

```typescript
// Example responsive text
className="text-sm sm:text-base md:text-lg lg:text-xl"
```

### Pre-Reader Friendly Design
- Icon-first navigation for non-readers
- High contrast text (WCAG AA compliant)
- Large, clear typography (Fredoka and Nunito fonts)
- Emoji and visual indicators for context

## Component Patterns

### Header
```tsx
// Responsive header with safe areas and flexible layout
<header className="
  fixed top-0 left-0 right-0 z-40
  flex flex-col sm:flex-row 
  items-center justify-between 
  gap-2 sm:gap-0 
  p-3 sm:p-4
  bg-gradient-to-r from-accent/20 to-primary/20
"
style={{
  paddingTop: 'max(0.75rem, env(safe-area-inset-top))'
}}>
```

### Navigation
```tsx
// Bottom navigation with safe area support
<nav className="
  fixed bottom-0 left-0 right-0 z-50
  h-[72px]
  bg-card/90 backdrop-blur-sm
"
style={{
  paddingBottom: 'env(safe-area-inset-bottom)'
}}>
```

### Cards
```tsx
// Responsive card grid
<div className="
  grid gap-4
  grid-cols-1
  md:grid-cols-2
  lg:grid-cols-3
  max-w-7xl mx-auto
">
```

## Viewport Resize Handling

### Jubee Position Revalidation
On viewport resize (especially breakpoint changes), Jubee's position is revalidated to prevent clipping:

**Implementation:** `src/App.tsx` lines 113-142

```typescript
useEffect(() => {
  const handleResize = () => {
    const currentBreakpoint = 
      window.innerWidth < 768 ? 'mobile' : 
      window.innerWidth < 1024 ? 'tablet' : 
      'desktop';
    
    if (currentBreakpoint !== previousBreakpoint) {
      const validated = validatePosition(containerPosition);
      useJubeeStore.getState().setContainerPosition(validated);
    }
  };
  
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, [containerPosition]);
```

**Debounce:** 300ms timeout to prevent excessive recalculations

## Performance Considerations

### Adaptive Rendering
- **Mobile:** Simplified animations, lower shadow quality
- **Tablet:** Balanced quality and performance
- **Desktop:** Full quality 3D rendering with shadows

### Media Queries
- Use `@media (prefers-reduced-motion: reduce)` for accessibility
- Respect battery-saving preferences
- Adaptive frame rates based on device capabilities

## Testing Matrix

### Required Test Viewports
✅ Must test on ALL breakpoints before deployment:

1. **Mobile (Portrait)**
   - 360×640px (Small Android)
   - 390×844px (iPhone 14)
   - 414×896px (iPhone Plus)

2. **Tablet (Portrait & Landscape)**
   - 768×1024px (iPad Mini)
   - 1024×768px (Landscape)
   - 820×1180px (iPad Air)

3. **Desktop**
   - 1440×900px (Standard laptop)
   - 1920×1080px (Full HD)
   - 2560×1440px (2K display)

### Cross-Browser Testing
- Safari (iOS) - Primary mobile browser
- Chrome (Android) - Primary Android browser
- Chrome (Desktop) - Development primary
- Firefox (Desktop) - Secondary validation
- Edge (Desktop) - Windows users

### Responsive Checklist
Before marking responsive work complete:

- [ ] No horizontal scrolling on any breakpoint
- [ ] All text remains readable (no truncation without overflow handling)
- [ ] Touch targets meet 44×44px minimum
- [ ] Safe areas respected on iOS/Android
- [ ] Jubee mascot fully visible on all viewports
- [ ] Navigation accessible at all breakpoints
- [ ] Forms usable on mobile without zoom-in
- [ ] Images load efficiently (lazy loading + responsive images)
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Console shows no responsive-related errors

## Future Enhancements

### Potential Improvements
- [ ] Fluid typography with `clamp()` for seamless scaling
- [ ] Container queries for component-level responsive design
- [ ] Orientation-specific layouts (`@media (orientation: landscape)`)
- [ ] Fold-aware layouts for foldable devices
- [ ] High refresh rate support (120Hz optimization)

## Resources

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [MDN Safe Area Insets](https://developer.mozilla.org/en-US/docs/Web/CSS/env)
- [WCAG Touch Target Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios)
- [Material Design Touch Targets](https://m3.material.io/foundations/accessible-design/accessibility-basics)
