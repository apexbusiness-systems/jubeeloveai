# Performance Budgets

## Overview
Performance budgets define maximum acceptable thresholds for key performance metrics to ensure Jubee.Love remains fast and responsive across all target devices.

## Core Web Vitals Budgets

### Loading Performance

| Metric | Mobile Target | Desktop Target | Current | Status |
|--------|---------------|----------------|---------|--------|
| **First Contentful Paint (FCP)** | < 1.8s | < 1.0s | TBD | 🟡 Monitor |
| **Largest Contentful Paint (LCP)** | < 2.5s | < 2.0s | TBD | 🟡 Monitor |
| **Time to Interactive (TTI)** | < 3.8s | < 2.5s | TBD | 🟡 Monitor |
| **Total Blocking Time (TBT)** | < 200ms | < 150ms | TBD | 🟡 Monitor |
| **Cumulative Layout Shift (CLS)** | < 0.1 | < 0.1 | TBD | 🟡 Monitor |
| **First Input Delay (FID)** | < 100ms | < 50ms | TBD | 🟡 Monitor |

### Bundle Size Budgets

| Resource Type | Target | Critical | Notes |
|--------------|--------|----------|-------|
| **Initial JS Bundle** | < 300KB | < 500KB | Gzipped, excluding vendor chunks |
| **Initial CSS Bundle** | < 50KB | < 75KB | Gzipped, critical CSS inline |
| **Vendor JS (React, etc.)** | < 150KB | < 200KB | Gzipped, split chunks |
| **Total Initial Load** | < 500KB | < 800KB | Gzipped, all initial resources |
| **Lazy Chunks (per route)** | < 100KB | < 150KB | Gzipped, code-split routes |
| **Images (per page)** | < 500KB | < 1MB | Optimized WebP/AVIF with lazy loading |
| **Fonts** | < 100KB | < 150KB | Subset fonts, font-display: swap |

### Network Performance

| Metric | 3G Target | 4G Target | WiFi Target |
|--------|-----------|-----------|-------------|
| **Time to First Byte (TTFB)** | < 600ms | < 300ms | < 100ms |
| **Full Page Load** | < 5s | < 3s | < 2s |
| **API Response Time** | < 1000ms | < 500ms | < 300ms |

## Runtime Performance Budgets

### Rendering Performance
**Warning Threshold:** 16ms per frame (60fps)  
**Critical Threshold:** 33ms per frame (30fps)

Enforced via `usePerformanceMonitor` hook:

```typescript
{
  logToConsole: true,
  warningThreshold: 16, // 60fps
}
```

#### Component-Specific Budgets

| Component | Average Render | Max Acceptable | Optimization Strategy |
|-----------|---------------|----------------|----------------------|
| **JubeeCanvas** | < 8ms | < 16ms | GPU acceleration, LOD system |
| **JubeeMascot** | < 5ms | < 10ms | Memoization, geometry optimization |
| **Navigation** | < 3ms | < 8ms | Virtual scrolling if needed |
| **GameModules** | < 10ms | < 16ms | Code splitting, lazy loading |
| **Home/Feed** | < 8ms | < 16ms | Virtualization for lists |

### Memory Budgets

| Resource | Target | Critical | Action on Exceed |
|----------|--------|----------|-----------------|
| **Heap Size** | < 50MB | < 100MB | Garbage collection, cleanup |
| **IndexedDB** | < 20MB | < 50MB | Sync and prune old data |
| **localStorage** | < 2MB | < 5MB | Clear non-critical data |
| **Canvas Memory** | < 10MB | < 20MB | Dispose Three.js geometries |
| **Image Cache** | < 30MB | < 50MB | LRU cache eviction |

### Animation Performance

| Animation Type | Target FPS | Budget | Fallback |
|---------------|-----------|--------|----------|
| **Jubee 3D Movement** | 60fps | 16ms/frame | Reduce to 30fps on low-end |
| **Page Transitions** | 60fps | 16ms/frame | Instant transition |
| **Particle Effects** | 60fps | 8ms/frame | Disable particles |
| **UI Animations** | 60fps | 5ms/frame | Reduce motion |

## Device-Specific Budgets

### Mobile (Low-End Android)
- **Target Device:** Android 8.0, 2GB RAM, Snapdragon 450
- **JS Execution:** < 3s on TTI
- **Memory:** < 50MB heap
- **Rendering:** 30fps acceptable, 60fps preferred

### Mobile (Mid-Range iPhone)
- **Target Device:** iPhone 11, A13 Bionic, 4GB RAM
- **JS Execution:** < 2s on TTI
- **Memory:** < 75MB heap
- **Rendering:** 60fps required

### Desktop
- **Target Device:** Intel i5 8th Gen, 8GB RAM, integrated GPU
- **JS Execution:** < 1.5s on TTI
- **Memory:** < 100MB heap
- **Rendering:** 60fps required

## Monitoring Implementation

### Automated Lighthouse CI
Configure Lighthouse CI for PR checks:

```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.85}],
        "categories:accessibility": ["error", {"minScore": 0.95}],
        "first-contentful-paint": ["error", {"maxNumericValue": 1800}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "interactive": ["error", {"maxNumericValue": 3800}],
        "total-blocking-time": ["error", {"maxNumericValue": 200}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}]
      }
    }
  }
}
```

### Real User Monitoring (RUM)
Track performance in production using Web Vitals:

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: Metric) {
  // Send to analytics service (Sentry, Google Analytics, etc.)
  console.log(metric.name, metric.value);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### Performance Dashboard
Track metrics via `PerformanceMonitor` page:
- Route: `/performance-monitor`
- Shows slow components, render metrics, memory usage
- Dev mode only

## Budget Enforcement

### Build-Time Checks

#### Webpack Bundle Analyzer
Visual inspection of bundle sizes:
```bash
npm run build -- --analyze
```

**Action Items on Budget Exceed:**
1. Identify large dependencies
2. Implement code splitting
3. Lazy load non-critical modules
4. Replace heavy libraries with lighter alternatives

#### Size Limit Plugin
Automatic bundle size checks in CI:

```json
{
  "size-limit": [
    {
      "path": "dist/assets/index-*.js",
      "limit": "300 KB"
    },
    {
      "path": "dist/assets/vendor-*.js",
      "limit": "150 KB"
    }
  ]
}
```

### Runtime Monitoring

#### Performance Observer API
Monitor long tasks and render blocking:

```typescript
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 50) {
      console.warn('Long task detected:', entry.duration, entry.name);
    }
  }
});

observer.observe({ entryTypes: ['longtask', 'measure'] });
```

#### React DevTools Profiler
Profile components in development:
1. Open React DevTools
2. Navigate to Profiler tab
3. Record interaction
4. Analyze flame graph for slow renders

## Optimization Strategies

### When Budgets Are Exceeded

#### Bundle Size > Target
1. ✅ Code split by route
2. ✅ Lazy load heavy components (games, 3D models)
3. ✅ Tree-shake unused code
4. ✅ Replace large libraries (e.g., moment.js → date-fns)
5. ✅ Compress assets (Brotli/Gzip)

#### LCP > 2.5s
1. ✅ Optimize hero images (WebP, lazy load)
2. ✅ Inline critical CSS
3. ✅ Preload key resources
4. ✅ Use CDN for static assets
5. ✅ Reduce server response time

#### FID/TBT > Target
1. ✅ Defer non-critical JavaScript
2. ✅ Break up long tasks (use `requestIdleCallback`)
3. ✅ Web Workers for heavy computation
4. ✅ Optimize event handlers
5. ✅ Reduce main thread work

#### CLS > 0.1
1. ✅ Set explicit dimensions for images/videos
2. ✅ Reserve space for dynamic content
3. ✅ Avoid inserting content above existing content
4. ✅ Use CSS containment

#### Slow Renders (> 16ms)
1. ✅ Memoize expensive computations (`useMemo`)
2. ✅ Avoid re-renders with `React.memo`
3. ✅ Virtualize long lists (`react-window`)
4. ✅ Debounce/throttle frequent updates
5. ✅ Use `useCallback` for stable function references

## Performance Budget Workflow

### Development
1. Use `usePerformanceMonitor` hook to profile components
2. Check browser DevTools Performance tab for bottlenecks
3. Run Lighthouse audits locally
4. Monitor bundle sizes with Vite build output

### Pre-Deployment
1. Run full Lighthouse CI suite
2. Compare bundle sizes against budgets
3. Test on target devices (low-end Android, mid-range iOS)
4. Verify Core Web Vitals meet targets

### Production
1. Monitor RUM metrics via analytics
2. Set up alerts for budget violations
3. Weekly performance review
4. A/B test performance improvements

## Exceptions and Overrides

### Acceptable Exceptions
Some scenarios allow temporary budget violations with justification:

1. **Initial Launch:** Feature completeness > absolute performance
2. **Critical Features:** User experience takes precedence (e.g., Jubee 3D quality)
3. **3rd Party Dependencies:** Supabase, OpenAI SDKs may exceed budgets
4. **Holiday Specials:** Temporary assets for seasonal events

**Requirement:** Document exception with:
- Reason for violation
- Expected impact
- Mitigation plan
- Timeline for resolution

## Continuous Improvement

### Monthly Performance Reviews
- Analyze RUM data trends
- Identify regression causes
- Prioritize optimization tasks
- Update budgets based on new baselines

### Quarterly Audits
- Full Lighthouse audit on production
- Device testing (5 representative devices)
- Competitive benchmarking
- Budget recalibration

## Tools and Resources

### Analysis Tools
- **Lighthouse:** Core Web Vitals auditing
- **WebPageTest:** Multi-location performance testing
- **Chrome DevTools:** Performance profiling
- **React DevTools Profiler:** Component render analysis
- **Webpack Bundle Analyzer:** Bundle size visualization

### Libraries
- **web-vitals:** RUM monitoring
- **size-limit:** Bundle size checks
- **lighthouse-ci:** Automated CI checks
- **react-window:** List virtualization
- **@loadable/component:** Code splitting

### References
- [Web Vitals](https://web.dev/vitals/)
- [Performance Budgets 101](https://web.dev/performance-budgets-101/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Vite Performance](https://vitejs.dev/guide/performance.html)
