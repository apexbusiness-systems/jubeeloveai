import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User } from '@supabase/supabase-js'
import { syncService } from '../lib/syncService'
import { supabase } from '@/integrations/supabase/client'
import { jubeeDB } from '../lib/indexedDB'

// Mock Supabase
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

// Mock IndexedDB
vi.mock('../lib/indexedDB', () => ({
  jubeeDB: {
    getUnsynced: vi.fn(),
    put: vi.fn(),
    putBulk: vi.fn().mockResolvedValue(undefined),
    get: vi.fn(),
    getAll: vi.fn(),
  },
}))

describe('SyncService Batch Optimization', () => {
  const mockUser = { id: 'test-user' } as unknown as User

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
  })

  it('should batch upsert calls for gameProgress', async () => {
    const unsyncedItems = Array.from({ length: 50 }, (_, i) => ({
      id: `gp-${i}`,
      score: i * 10,
      activitiesCompleted: i,
      currentTheme: 'default',
      lastActivity: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false
    }))

    vi.mocked(jubeeDB.getUnsynced).mockImplementation(async (store) => {
      if (store === 'gameProgress') return unsyncedItems
      return []
    })

    const upsertSpy = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValue({
      upsert: upsertSpy,
      insert: vi.fn().mockResolvedValue({ error: null }),
    } as any) // eslint-disable-line @typescript-eslint/no-explicit-any

    await syncService.syncAll()

    // OPTIMIZED BEHAVIOR (Batch): Expect 1 call for all 50 items
    expect(upsertSpy).toHaveBeenCalledTimes(1)

    // Verify payload of the call
    const callArgs = upsertSpy.mock.calls[0][0]
    expect(callArgs).toHaveLength(50)
    expect(callArgs[0]).toMatchObject({
      user_id: 'test-user',
      score: 0
    })

    // Verify putBulk was called
    expect(jubeeDB.putBulk).toHaveBeenCalledWith('gameProgress', expect.any(Array))
  })

  it('should batch insert calls for drawings in chunks', async () => {
    const unsyncedItems = Array.from({ length: 20 }, (_, i) => ({
      id: `drawing-${i}`,
      title: `Drawing ${i}`,
      imageData: 'data:image/png;base64,fake',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false
    }))

    vi.mocked(jubeeDB.getUnsynced).mockImplementation(async (store) => {
      if (store === 'drawings') return unsyncedItems
      return []
    })

    const insertSpy = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValue({
      insert: insertSpy,
      upsert: vi.fn().mockResolvedValue({ error: null }),
    } as any) // eslint-disable-line @typescript-eslint/no-explicit-any

    await syncService.syncAll()

    // OPTIMIZED BEHAVIOR (Batch): Expect 2 calls (20 items / 10 batch size)
    expect(insertSpy).toHaveBeenCalledTimes(2)

    // Verify chunk sizes
    expect(insertSpy.mock.calls[0][0]).toHaveLength(10)
    expect(insertSpy.mock.calls[1][0]).toHaveLength(10)

    // Verify putBulk was called twice (once per chunk)
    expect(jubeeDB.putBulk).toHaveBeenCalledTimes(2)
    expect(jubeeDB.putBulk).toHaveBeenCalledWith('drawings', expect.any(Array))
  })
})
