# Jubee Rendering Reliability & Offline Performance

## Overview
Comprehensive guardrails and fail-safes implemented to ensure Jubee's rendering system never regresses, with optimized offline performance and reliability.

## Rendering Guardrails

### 1. Error Recovery System (`JubeeErrorRecovery.ts`)
**Purpose**: Automated error detection and recovery with exponential backoff

**Features**:
- **Recovery Attempts Tracking**: Monitors consecutive failures (max 3 attempts)
- **Throttling**: Prevents rapid-fire recovery attempts that could worsen issues
- **Graceful Recovery**: Automatically resets after successful operations
- **Logging**: Comprehensive error tracking for debugging

**Usage**:
```typescript
import { jubeeErrorRecovery } from '@/core/jubee/JubeeErrorRecovery';

// Attempt recovery on error
await jubeeErrorRecovery.attemptRecovery(error);

// Reset after successful operation
jubeeErrorRecovery.reset();
```

### 2. WebGL Context Recovery (`useWebGLContextRecovery.ts`)
**Purpose**: Automatically detect and recover from WebGL context loss

**Features**:
- **Context Loss Detection**: Listens for `webglcontextlost` events
- **Automatic Restoration**: Triggers context restoration on loss
- **Periodic Health Checks**: Validates context every 5 seconds
- **Exponential Backoff**: Progressive retry delays for failed recoveries
- **Max Retry Limit**: Prevents infinite recovery loops (3 attempts)

**Integration**:
```typescript
const webglRecovery = useWebGLContextRecovery(canvasRef, {
  onContextLost: () => console.log('Context lost'),
  onContextRestored: () => console.log('Context restored'),
  maxRecoveryAttempts: 3,
  recoveryDelay: 1000,
});
```

### 3. Rendering Guard (`JubeeRenderingGuard.ts`)
**Purpose**: Real-time validation of rendering state

**Features**:
- **Container Validation**: Ensures container exists in DOM with valid dimensions
- **Canvas Validation**: Verifies canvas element and dimensions
- **WebGL Context Validation**: Tests context health with basic rendering
- **Render Stall Detection**: Identifies when rendering stops (10s threshold)
- **Automatic Recovery**: Triggers recovery when issues detected
- **Health Monitoring**: Periodic checks every 3 seconds

**Health Check Result**:
```typescript
{
  healthy: boolean,
  issues: string[],
  state: {
    containerExists: boolean,
    canvasExists: boolean,
    webglContextValid: boolean,
    isInViewport: boolean,
    hasValidDimensions: boolean,
    lastRenderTimestamp: number
  }
}
```

### 4. State Validation (`JubeeStateValidator.ts`)
**Purpose**: Prevent invalid state before application

**Validators**:
- **Container Position**: Bounds checking with safety margins (20px)
- **Canvas Position**: 3D coordinate validation (X: [-5.5, 5.5], Y: [-3.5, 1.2], Z: [-2, 2])
- **Animation States**: Whitelist validation ('idle', 'excited', 'celebrate', etc.)
- **Mood States**: Validation against valid moods
- **Visibility**: Boolean type checking
- **NaN/Infinity Detection**: Prevents invalid numbers

**Auto-Sanitization**: Invalid values automatically clamped to safe ranges

## Offline Performance Optimizations

### 1. Enhanced Offline Queue (`offlineQueue.ts`)
**Purpose**: Reliable operation queuing with priority and retry logic

**Features**:
- **Priority System**: Operations ranked 1-10 (higher = more important)
- **Exponential Backoff**: Retry delays: 1s, 2s, 5s, 10s, 30s
- **Max Queue Size**: 1000 operations limit
- **Persistent Storage**: Queue saved to localStorage
- **Automatic Processing**: Processes when online (every 30s)
- **Max Retries**: 5 attempts per operation before removal

**Queue Statistics**:
```typescript
{
  total: number,
  byType: { sync: 5, upload: 2, delete: 1 },
  byPriority: { 1: 2, 5: 4, 10: 2 },
  failed: number
}
```

### 2. Background Sync Integration (`syncService.ts`)
**Purpose**: Automatic syncing when network connectivity returns

**Features**:
- **Background Sync API**: Registers sync events with service worker
- **Automatic Retry**: Processes queue when coming back online
- **Online Event Listener**: Immediate sync when network detected
- **Periodic Processing**: Syncs every 30 seconds when online
- **Graceful Fallback**: Works without Background Sync API

### 3. Service Worker Caching (`vite.config.ts`)
**Purpose**: Optimized cache strategies for offline access

**Cache Strategies**:
- **Fonts (CacheFirst)**: Google Fonts cached for 1 year
- **API (NetworkFirst)**: 10s timeout, 5min cache, 50 entries
- **Pages (NetworkFirst)**: 5s timeout, 24h cache
- **Assets (Precache)**: All static assets cached on install

**Cache Names**:
- `google-fonts-cache`: Font files
- `gstatic-fonts-cache`: Font stylesheets
- `api-cache`: API responses
- `pages-cache`: Page HTML

## Integration Architecture

### Component Integration Flow
```
JubeeCanvas3DDirect
  ├── useJubeeRenderingGuard
  │     ├── Container validation
  │     ├── Canvas validation
  │     └── WebGL validation
  ├── useWebGLContextRecovery
  │     ├── Context loss listener
  │     ├── Context restore listener
  │     └── Periodic health checks
  └── jubeeErrorRecovery
        ├── Recovery attempts
        └── Throttling logic
```

### Recovery Escalation Strategy
1. **First Failure**: Position reset (safe defaults)
2. **Second Failure**: Animation reset + position reset
3. **Third Failure**: Full state reset (all properties)
4. **Max Failures**: Graceful degradation (hide Jubee, keep app functional)

### Offline Sync Flow
```
User Action → Offline Queue → localStorage
                              ↓
Network Returns → Background Sync → Sync Service
                                    ↓
                                 Supabase
                                    ↓
                                IndexedDB
```

## Performance Budgets

### Rendering Performance
- **Health Check Overhead**: <1ms per check (every 3s)
- **Validation Overhead**: <0.1ms per state update
- **Recovery Time**: 1-3s typical, 30s max backoff
- **Frame Rate Impact**: Zero (checks run outside render loop)

### Offline Performance
- **Queue Processing**: <100ms for 100 operations
- **Sync Latency**: 1-5s typical (network dependent)
- **Storage Overhead**: ~1KB per queued operation
- **Max Queue Memory**: ~1MB (1000 operations)

## Monitoring & Debugging

### Console Logging
All systems log to console with prefixes:
- `[Jubee Recovery]`: Error recovery attempts
- `[WebGL Recovery]`: Context loss/restore events
- `[Rendering Guard]`: Health check results
- `[State Validator]`: Validation errors/warnings
- `[Offline Queue]`: Queue operations

### Health Check API
```typescript
// Get current render health
const health = renderingGuard.getHealth();
console.log(health.healthy, health.issues);

// Get recovery stats
const stats = jubeeErrorRecovery.getStats();
console.log(stats.consecutiveFailures, stats.nextBackoffDelay);

// Get queue stats
const queueStats = offlineQueue.getStats();
console.log(queueStats.total, queueStats.failed);
```

## Anti-Regression Guarantees

### Rendering Systems
✅ Container/canvas existence validated before every render
✅ WebGL context health monitored continuously
✅ Automatic recovery on context loss
✅ State validation prevents invalid values
✅ Render stall detection (10s threshold)
✅ Exponential backoff prevents recovery storms

### Offline Systems
✅ Operations queued with priority
✅ Automatic retry with exponential backoff
✅ Background sync when network returns
✅ Persistent queue survives page refresh
✅ Max retry limits prevent infinite loops
✅ Graceful handling of queue overflow

## Testing Checklist

### Rendering Reliability
- [ ] Drag Jubee rapidly - should never disappear
- [ ] Resize viewport - should reposition safely
- [ ] Lose WebGL context (via extension) - should recover
- [ ] Rapid visibility toggles - should handle gracefully
- [ ] Invalid state updates - should sanitize

### Offline Reliability
- [ ] Go offline mid-operation - should queue
- [ ] Come back online - should sync automatically
- [ ] Refresh page offline - queue should persist
- [ ] Fill queue to limit - should handle overflow
- [ ] Max retries reached - should remove failed ops

## Future Enhancements

### Phase 1 (Completed)
✅ Error recovery with exponential backoff
✅ WebGL context recovery
✅ Rendering state validation
✅ Offline queue with retry logic
✅ Background sync integration

### Phase 2 (Planned)
- [ ] Predictive failure detection
- [ ] State history snapshots for rollback
- [ ] Performance metrics dashboard
- [ ] Visual debugging overlay (dev mode)
- [ ] Telemetry for error patterns

### Phase 3 (Planned)
- [ ] Machine learning for failure prediction
- [ ] Smart recovery strategy selection
- [ ] A/B testing of recovery methods
- [ ] Self-healing optimizations
- [ ] Real-time health monitoring dashboard

## Maintenance

### Adding New Validators
1. Add validator function to `JubeeStateValidator.ts`
2. Integrate into `validateJubeeState` composite function
3. Test edge cases (NaN, Infinity, out-of-bounds)
4. Update validation bounds documentation

### Tuning Recovery Logic
- Adjust `MAX_RECOVERY_ATTEMPTS` for more/fewer retries
- Modify `BASE_DELAY` and `MAX_DELAY` for backoff timing
- Update health check intervals based on performance impact
- Tune validation bounds for tighter/looser constraints

### Performance Optimization
- Monitor health check overhead in production
- Adjust queue processing intervals based on load
- Optimize cache strategies based on usage patterns
- Review and cleanup old queue entries periodically

## Support

For issues with rendering reliability or offline performance:
1. Check console logs for error/recovery messages
2. Use `renderingGuard.getHealth()` for current status
3. Review queue stats with `offlineQueue.getStats()`
4. Check recovery history for pattern analysis
5. Test with `WEBGL_lose_context` extension for context loss
