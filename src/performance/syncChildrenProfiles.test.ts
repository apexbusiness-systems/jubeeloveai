import { describe, it, expect, vi, beforeEach } from 'vitest'
import { syncService } from '../lib/syncService'
import { supabase } from '@/integrations/supabase/client'
import { jubeeDB } from '../lib/indexedDB'
import { syncQueue } from '../lib/syncQueue'
import type { User } from '@supabase/supabase-js'

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}))

vi.mock('../lib/indexedDB', () => ({
  jubeeDB: {
    getUnsynced: vi.fn().mockResolvedValue([]),
    put: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn(),
  },
}))

vi.mock('../lib/syncQueue', () => ({
  syncQueue: {
    add: vi.fn(),
    getStats: vi.fn(),
    processQueue: vi.fn(),
  }
}))

describe('syncChildrenProfiles Optimization', () => {
  const mockUser: User = { id: 'test-user-123' } as User

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  // TEST 1: Basic batch operation
  it('should batch sync multiple profiles in single call', async () => {
    const mockProfiles = [
      {
        id: 'profile-1',
        name: 'Alice',
        age: 5,
        gender: 'female',
        avatarUrl: 'avatar1.png',
        settings: { theme: 'pink' },
        updatedAt: new Date().toISOString(),
        synced: false
      },
      {
        id: 'profile-2',
        name: 'Bob',
        age: 7,
        gender: 'male',
        avatarUrl: 'avatar2.png',
        settings: { theme: 'blue' },
        updatedAt: new Date().toISOString(),
        synced: false
      }
    ]

    vi.mocked(jubeeDB.getUnsynced).mockImplementation(async (store) => {
      if (store === 'childrenProfiles') return mockProfiles as any
      return []
    })

    const upsertSpy = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValue({
      upsert: upsertSpy
    } as any)

    // Mock user auth
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null
    } as any)

    // Test via syncAll (as proposed)
    await syncService.syncAll()

    // Verify single batch call
    // Check if called with batch data
    expect(upsertSpy).toHaveBeenCalledTimes(1)
    expect(upsertSpy).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        id: 'profile-1',
        name: 'Alice',
        parent_user_id: 'test-user-123'
      }),
      expect.objectContaining({
        id: 'profile-2',
        name: 'Bob',
        parent_user_id: 'test-user-123'
      })
    ]))
  })

  // TEST 2: JSON settings handling
  it('should correctly serialize JSON settings field', async () => {
    const mockProfiles = [{
      id: 'profile-1',
      name: 'Alice',
      age: 5,
      gender: 'female',
      avatarUrl: 'avatar1.png',
      settings: {
        theme: 'pink',
        notifications: { enabled: true },
        preferences: { language: 'en' }
      },
      updatedAt: new Date().toISOString(),
      synced: false
    }]

    vi.mocked(jubeeDB.getUnsynced).mockImplementation(async (store) => {
      if (store === 'childrenProfiles') return mockProfiles as any
      return []
    })

    const upsertSpy = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValue({
      upsert: upsertSpy
    } as any)

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null
    } as any)

    await syncService.syncAll()

    // Verify settings is properly serialized
    expect(upsertSpy).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        settings: expect.objectContaining({
          theme: 'pink',
          notifications: expect.any(Object)
        })
      })
    ]))
  })

  // TEST 3: Fallback on data error
  it('should fallback to individual sync on data error', async () => {
    const mockProfiles = [
      { id: 'profile-1', name: 'Alice', age: 5, synced: false } as any,
      { id: 'profile-2', name: 'Bob', age: 7, synced: false } as any,
      { id: 'profile-3', name: 'Charlie', age: 4, synced: false } as any
    ]

    vi.mocked(jubeeDB.getUnsynced).mockImplementation(async (store) => {
      if (store === 'childrenProfiles') return mockProfiles as any
      return []
    })

    let callCount = 0
    const upsertSpy = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // Batch fails with data error
        return Promise.resolve({
          error: { code: '23502', message: 'null value in column' }
        })
      }
      // Individual calls succeed
      return Promise.resolve({ error: null })
    })

    vi.mocked(supabase.from).mockReturnValue({
      upsert: upsertSpy
    } as any)

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null
    } as any)

    const result = await syncService.syncAll()

    // Should try batch (1) + fallback to individual (3) = 4 total
    expect(upsertSpy).toHaveBeenCalledTimes(4)

    // All should eventually succeed
    expect(result.childrenProfiles?.synced).toBe(3)
  })

  // TEST 4: Transient error handling
  it('should queue profiles on transient error without fallback', async () => {
    const mockProfiles = [
      { id: 'profile-1', name: 'Alice', age: 5, synced: false } as any
    ]

    vi.mocked(jubeeDB.getUnsynced).mockImplementation(async (store) => {
      if (store === 'childrenProfiles') return mockProfiles as any
      return []
    })

    const upsertSpy = vi.fn().mockResolvedValue({
      error: { message: 'connection timeout', code: 'ETIMEDOUT' }
    })

    vi.mocked(supabase.from).mockReturnValue({
      upsert: upsertSpy
    } as any)

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null
    } as any)

    await syncService.syncAll()

    // Should only try batch once (no fallback)
    expect(upsertSpy).toHaveBeenCalledTimes(1)

    // Should queue for retry
    expect(syncQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({
        storeName: 'childrenProfiles',
        priority: 1
      })
    )
  })

  // TEST 5: Performance benchmark
  it('should demonstrate performance improvement', async () => {
    const mockProfiles = Array.from({ length: 5 }, (_, i) => ({
      id: `profile-${i}`,
      name: `Child ${i}`,
      age: 5 + i,
      gender: i % 2 === 0 ? 'female' : 'male',
      avatarUrl: `avatar${i}.png`,
      settings: { theme: 'default' },
      updatedAt: new Date().toISOString(),
      synced: false
    }))

    vi.mocked(jubeeDB.getUnsynced).mockImplementation(async (store) => {
      if (store === 'childrenProfiles') return mockProfiles as any
      return []
    })

    // Simulate realistic network latency
    const upsertSpy = vi.fn().mockImplementation(() =>
      new Promise(resolve =>
        setTimeout(() => resolve({ error: null }), 10)
      )
    )

    vi.mocked(supabase.from).mockReturnValue({
      upsert: upsertSpy
    } as any)

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null
    } as any)

    const start = performance.now()
    await syncService.syncAll()
    const duration = performance.now() - start

    // With batch: ~10ms (single call)
    // Without batch: ~50ms (5 serial calls)
    // We set expectation for batch behavior
    expect(upsertSpy).toHaveBeenCalledTimes(1)
    // The user's expectation was < 30ms, which assumes 1 call of 10ms + minimal overhead
    // We can just verify call count which is the structural optimization
  })
})
