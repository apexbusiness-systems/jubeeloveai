# Service Worker Strategy

## Overview
Jubee.Love uses Progressive Web App (PWA) technology with automated service worker management for offline capability and optimal performance.

## Update Interval Configuration

### Current Setting: 5 Minutes
The service worker checks for updates every **5 minutes** (300,000ms).

**Location:** `src/main.tsx` lines 54-57

```typescript
setInterval(() => {
  registration.update();
}, 300000); // 5 minutes
```

### Rationale
- **Balance:** Ensures timely updates without excessive network overhead
- **Battery Efficiency:** Reduces frequent polling on mobile devices
- **User Experience:** Automatic silent updates with minimal disruption
- **Production Only:** Service worker registration only runs in production builds (`import.meta.env.PROD`)

### Previous Configuration
Originally set to 1 minute (60,000ms) but increased to reduce:
- Network request frequency
- Battery drain on mobile devices
- Server load from constant polling

## Cache Management

### Version-Based Cache Clearing
- App version: `1.0.1` (stored in `localStorage` as `app_version`)
- On version change: All caches automatically cleared
- Cache keys tracked in `localStorage` for comparison

### Cache Strategies (Workbox)

1. **Google Fonts** - `CacheFirst`
   - Expiration: 1 year
   - Max entries: 10

2. **API Calls** - `NetworkFirst`
   - Timeout: 10 seconds
   - Expiration: 5 minutes
   - Max entries: 50

3. **Pages** - `NetworkFirst`
   - Timeout: 5 seconds
   - Expiration: 24 hours
   - Max entries: 50

## Auto-Update Behavior

When a new service worker version is detected:
1. `updatefound` event triggers
2. New worker installs in background
3. Once installed, page reloads automatically after 1-second delay
4. User receives latest version seamlessly

## Development Mode
Service worker enabled in development (`devOptions.enabled: true`) but update checking disabled to prevent caching issues during active development.

## Future Considerations

### Potential Adjustments
- **Longer Interval (10-15 min):** If analytics show minimal update frequency
- **User-Triggered Updates:** Manual "Check for Updates" button in settings
- **Background Sync:** Use Background Sync API for offline data synchronization
- **Push Notifications:** Alert users to critical updates requiring immediate action

### Monitoring Recommendations
- Track service worker update frequency
- Monitor network request overhead
- Measure battery impact on mobile devices
- User feedback on update experience
