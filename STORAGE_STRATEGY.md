# Storage Strategy Documentation

## Overview
This document defines the storage architecture for Jubee Love, ensuring consistency, avoiding conflicts, and maintaining data integrity across offline-first capabilities.

## Storage Mechanisms

### 1. Zustand with Persist Middleware
**Purpose**: Application state that needs to be persisted across sessions
**Storage Backend**: localStorage (managed automatically by Zustand)
**Use Cases**:
- User preferences and settings
- Game state (scores, progress, themes)
- Child profiles and parental controls
- Achievement tracking
- Jubee mascot configuration

**Stores**:
- `useGameStore` → `jubeelove-game-storage`
- `useParentalStore` → `jubeelove-parental-storage`
- `useAchievementStore` → `jubeelove-achievement-storage`
- `useJubeeStore` → NOT persisted (runtime state only)

**Advantages**:
- ✅ Automatic serialization/deserialization
- ✅ Type-safe with TypeScript
- ✅ Reactive updates across components
- ✅ Structured storage with schema
- ✅ Easy to test and debug

**Guidelines**:
- Use for global application state
- Use for data that needs reactivity across components
- Keep state normalized and minimal
- Avoid storing large binary data

### 2. IndexedDB (via jubeeDB service)
**Purpose**: Structured data storage with offline sync capabilities
**Storage Backend**: IndexedDB (with localStorage fallback)
**Use Cases**:
- User-generated content (drawings)
- Activity history
- Game progress records
- Sticker collections
- Data that needs bidirectional Supabase sync

**Stores**:
- `gameProgress` - Game session data with sync status
- `achievements` - Achievement unlocks with sync status
- `drawings` - Canvas artwork with metadata
- `stickers` - Unlocked sticker data
- `childrenProfiles` - Child profile data for offline access

**Advantages**:
- ✅ Handles large datasets efficiently
- ✅ Structured queries and indexes
- ✅ Built-in transaction support
- ✅ Offline-first with sync tracking
- ✅ No size limitations (unlike localStorage)

**Guidelines**:
- Use for user-generated content
- Use for data that syncs with Supabase
- Use for large datasets (>5MB)
- Include `synced` flag for all records

### 3. Direct localStorage (DEPRECATED - Being Phased Out)
**Purpose**: Legacy direct access - AVOID IN NEW CODE
**Current Usage**: Being migrated away
**Migration Status**:
- ✅ Drawing data → Migrated to IndexedDB service
- ✅ Parental daily reset tracking → Migrated to Zustand store
- ❌ Supabase client auth → Keep (managed by Supabase)

**Guidelines**:
- ❌ DO NOT use for new features
- ❌ DO NOT access directly - use Zustand or IndexedDB
- ✅ ONLY exception: Third-party libraries that manage their own storage

## Storage Decision Tree

```
Need to store data?
│
├─ Is it auth/session data?
│  └─ Let Supabase handle it (supabase client config)
│
├─ Is it large user-generated content (>1MB)?
│  └─ Use IndexedDB (jubeeDB service)
│
├─ Does it need to sync with Supabase?
│  └─ Use IndexedDB (jubeeDB service) with sync flags
│
├─ Is it global app state/preferences?
│  └─ Use Zustand with persist middleware
│
├─ Is it transient runtime state?
│  └─ Use Zustand WITHOUT persist
│
└─ Still unsure?
   └─ Ask: Does it need reactivity across components?
      ├─ Yes → Zustand
      └─ No → IndexedDB
```

## Migration Checklist

### Phase 2 (Current) - Consolidation
- [x] Audit all localStorage usage
- [x] Create storage strategy documentation
- [x] Migrate drawing data to IndexedDB service
- [x] Migrate parental store daily reset to Zustand
- [x] Update all imports and dependencies
- [ ] Test all storage mechanisms work together
- [ ] Verify no conflicts or race conditions

### Phase 3 (Future) - Optimization
- [ ] Add storage quota monitoring
- [ ] Implement cleanup for old data
- [ ] Add data compression for large datasets
- [ ] Performance profiling

## Storage Keys Registry

### Zustand Keys (localStorage)
- `jubeelove-game-storage` - Game state, scores, themes
- `jubeelove-parental-storage` - Child profiles, parental controls, session tracking
- `jubeelove-achievement-storage` - Achievement progress and unlocks

### IndexedDB Database
- **Database Name**: `JubeeLoveDB`
- **Version**: 1
- **Object Stores**:
  - `gameProgress` (key: `id`)
  - `achievements` (key: `id`)
  - `drawings` (key: `id`)
  - `stickers` (key: `id`)
  - `childrenProfiles` (key: `id`)

### Reserved Keys (DO NOT USE)
- `supabase.auth.token` - Managed by Supabase
- `i18nextLng` - Managed by i18next

## Best Practices

### 1. Data Consistency
```typescript
// ✅ GOOD - Use store actions
const { addScore } = useGameStore()
addScore(50)

// ❌ BAD - Direct localStorage
localStorage.setItem('score', '50')
```

### 2. Type Safety
```typescript
// ✅ GOOD - Typed store
const score = useGameStore(state => state.score)

// ❌ BAD - Untyped localStorage
const score = parseInt(localStorage.getItem('score') || '0')
```

### 3. Error Handling
```typescript
// ✅ GOOD - Service handles errors
await jubeeDB.put('drawings', drawingData)

// ❌ BAD - Unhandled errors
localStorage.setItem('drawing', JSON.stringify(data))
```

### 4. Reactivity
```typescript
// ✅ GOOD - Reactive updates
const drawings = useDrawingStore(state => state.drawings)

// ❌ BAD - Manual polling
useEffect(() => {
  const interval = setInterval(() => {
    const data = localStorage.getItem('drawings')
    // Manual parsing and state updates
  }, 1000)
}, [])
```

## Testing Storage

### Unit Tests
```typescript
// Test Zustand stores
import { useGameStore } from '@/store/useGameStore'

test('adds score correctly', () => {
  const { addScore, score } = useGameStore.getState()
  addScore(50)
  expect(useGameStore.getState().score).toBe(50)
})
```

### Integration Tests
```typescript
// Test IndexedDB sync
import { jubeeDB } from '@/lib/indexedDB'
import { syncService } from '@/lib/syncService'

test('syncs drawings to Supabase', async () => {
  await jubeeDB.put('drawings', mockDrawing)
  await syncService.syncDrawings()
  // Verify sync status
})
```

## Troubleshooting

### Storage Quota Exceeded
1. Check total storage usage
2. Clear old/synced data
3. Implement data cleanup policies

### Sync Conflicts
1. Check `synced` flag in IndexedDB
2. Review last sync timestamp
3. Force manual sync via UI

### Data Loss Prevention
1. Always use transactions for IndexedDB
2. Implement retry logic with exponential backoff
3. Keep error logs for debugging
4. Regular automated backups for critical data

## References
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/)
