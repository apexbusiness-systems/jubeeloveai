# Offline Storage & Error Handling

This document explains the enhanced persistence and error handling features implemented in Jubee Love.

## Overview

The application now supports:
1. **Offline-first data storage** using IndexedDB with localStorage fallback
2. **Automatic sync** with Supabase when online
3. **Comprehensive error handling** with retry logic and graceful degradation
4. **User-friendly error messages** and recovery options

## Architecture

### Data Flow

```
User Action → IndexedDB (Local) → Sync Service → Supabase (Remote)
                                ↓
                        Automatic Conflict Resolution
```

## Features

### 1. IndexedDB Service (`src/lib/indexedDB.ts`)

Provides persistent local storage with the following stores:

- **gameProgress**: Scores, activities completed, current theme
- **achievements**: Unlocked achievements
- **drawings**: User drawings with image data
- **stickers**: Collected stickers
- **childrenProfiles**: Child profile information

**Key Features:**
- Generic CRUD operations
- Automatic fallback to localStorage if IndexedDB fails
- Support for unsynced record tracking
- Browser compatibility checks

**Usage Example:**
```typescript
import { jubeeDB } from '@/lib/indexedDB'

// Save game progress
await jubeeDB.put('gameProgress', {
  id: 'user-123',
  score: 100,
  activitiesCompleted: 5,
  currentTheme: 'morning',
  updatedAt: new Date().toISOString(),
  synced: false
})

// Get all drawings
const drawings = await jubeeDB.getAll('drawings')

// Get unsynced records
const unsynced = await jubeeDB.getUnsynced('achievements')
```

### 2. Sync Service (`src/lib/syncService.ts`)

Handles bidirectional synchronization between IndexedDB and Supabase.

**Key Features:**
- Automatic sync when online
- Manual sync trigger
- Batch operations with error tolerance
- Conflict resolution (last-write-wins)
- Per-store sync status tracking

**Usage Example:**
```typescript
import { syncService } from '@/lib/syncService'

// Start automatic sync (runs every 60 seconds)
syncService.startAutoSync()

// Manual sync
const results = await syncService.syncAll()
console.log('Sync results:', results)

// Pull latest data from Supabase
await syncService.pullFromSupabase()

// Stop automatic sync
syncService.stopAutoSync()
```

### 3. Offline Sync Hook (`src/hooks/useOfflineSync.ts`)

React hook that monitors online/offline status and manages sync.

**Usage Example:**
```typescript
import { useOfflineSync } from '@/hooks/useOfflineSync'

function MyComponent() {
  const { isOnline, isSyncing, manualSync } = useOfflineSync()

  return (
    <div>
      <p>Status: {isOnline ? 'Online' : 'Offline'}</p>
      {isSyncing && <p>Syncing...</p>}
      <button onClick={manualSync}>Sync Now</button>
    </div>
  )
}
```

### 4. Error Handler (`src/lib/errorHandler.ts`)

Comprehensive error handling utility with multiple strategies.

**Key Features:**
- Automatic retry with exponential backoff
- Timeout handling
- Fallback mechanisms
- Batch operations with error tolerance
- User-friendly error messages
- Error logging and tracking

**Usage Examples:**

```typescript
import { errorHandler } from '@/lib/errorHandler'

// Retry with exponential backoff
const data = await errorHandler.withRetry(
  () => fetchData(),
  {
    maxRetries: 3,
    delayMs: 1000,
    exponentialBackoff: true,
    onRetry: (attempt, error) => {
      console.log(`Retry ${attempt} after error:`, error)
    }
  }
)

// With timeout
const result = await errorHandler.withTimeout(
  () => longRunningOperation(),
  5000, // 5 second timeout
  'Operation timed out'
)

// With fallback
const value = await errorHandler.withFallback(
  () => fetchFromAPI(),
  () => getCachedData(),
  (error) => console.warn('Falling back due to:', error)
)

// Batch operations with error tolerance
const results = await errorHandler.batch(
  items,
  async (item) => processItem(item),
  {
    concurrency: 5,
    continueOnError: true,
    onError: (item, error) => {
      console.error('Failed to process:', item, error)
    }
  }
)

// Log error with context
errorHandler.logError(error, {
  component: 'DrawingCanvas',
  action: 'save',
  userId: user.id
})

// Get user-friendly message
const message = errorHandler.getUserMessage(error)
```

### 5. Offline Indicator Component

Visual indicator showing online/offline status and sync state.

**Features:**
- Shows offline status
- Shows syncing progress
- Quick sync button when online
- Auto-hides when online and not syncing

### 6. Enhanced Error Boundary

React Error Boundary with improved UX and retry logic.

**Features:**
- Jubee-themed error messages
- Retry counter
- Development error details
- Multiple recovery options
- Error logging

## Database Schema

The following tables are created in Supabase:

### profiles
- User profile information
- Links to auth.users

### children_profiles
- Child profile data for parental controls
- Settings stored as JSONB

### game_progress
- Scores and activity completion
- Current theme
- Last activity

### achievements
- Unlocked achievements
- Timestamp tracking

### drawings
- User-created drawings
- Image data as base64

### stickers
- Collected stickers
- Unlock timestamps

## Security

All tables have Row Level Security (RLS) enabled with policies:
- Users can only access their own data
- Parents can only access their children's profiles
- Authenticated users required for all operations

## Best Practices

### 1. Save Data Locally First
Always save to IndexedDB before attempting Supabase sync:

```typescript
// ✅ Good
await jubeeDB.put('drawings', drawing)
await syncService.syncAll()

// ❌ Bad - data could be lost if sync fails
await supabase.from('drawings').insert(drawing)
```

### 2. Handle Offline States
Always provide feedback for offline users:

```typescript
const { isOnline } = useOfflineSync()

if (!isOnline) {
  return <div>Offline - Changes will sync when back online</div>
}
```

### 3. Use Error Handler for Network Operations
Wrap network calls with error handler:

```typescript
const data = await errorHandler.withRetry(
  () => supabase.from('table').select(),
  { maxRetries: 3 }
)
```

### 4. Provide Fallbacks
Always have a fallback for critical features:

```typescript
const greeting = await errorHandler.withFallback(
  () => jubeeStore.converse(message),
  () => "Buzz buzz! Let's try that again!"
)
```

## Troubleshooting

### Data Not Syncing
1. Check browser console for errors
2. Verify IndexedDB is supported
3. Check network connection
4. Manually trigger sync with `manualSync()`

### IndexedDB Errors
- Data automatically falls back to localStorage
- Check browser storage quota
- Clear old data if needed

### Sync Conflicts
- Last-write-wins strategy applied
- Server timestamp used for conflict resolution
- Local data marked as synced after successful upload

## Performance Considerations

1. **Batch Operations**: Use `errorHandler.batch()` for multiple operations
2. **Debounce Saves**: Avoid saving on every keystroke
3. **Limit Sync Frequency**: Default 60-second interval is reasonable
4. **Clean Old Data**: Periodically clear synced records

## Future Improvements

- [ ] Operational transformation for real-time collaboration
- [ ] Smarter conflict resolution
- [ ] Background sync worker
- [ ] Storage quota management
- [ ] Delta sync (only changed fields)
- [ ] Compression for large data
- [ ] Error analytics dashboard
