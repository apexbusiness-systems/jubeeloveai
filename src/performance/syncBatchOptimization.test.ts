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

  it('should call getUser only once during syncAll', async () => {
    vi.mocked(jubeeDB.getUnsynced).mockResolvedValue([])
    await syncService.syncAll()
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(1)
  })

  it('should call getUser only once during processQueue', async () => {
    // We don't need to mock syncQueue internals if we only check getUser calls
    await syncService.processQueue()
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(1)
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
    } as any)

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

  it('should batch achievements sync into single network call', async () => {
    const mockAchievements = Array.from({ length: 50 }, (_, i) => ({
      id: `ach-${i}`,
      achievementId: `achievement-${i}`,
      unlockedAt: new Date().toISOString(),
      synced: false
    }))

    vi.mocked(jubeeDB.getUnsynced).mockImplementation(async (store) => {
      if (store === 'achievements') return mockAchievements
      return []
    })

    const upsertSpy = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValue({
      upsert: upsertSpy,
      insert: vi.fn().mockResolvedValue({ error: null }),
    } as any)

    await syncService.syncAll()

    expect(upsertSpy).toHaveBeenCalledTimes(1)
    expect(upsertSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ achievement_id: 'achievement-0' }),
        expect.objectContaining({ achievement_id: 'achievement-49' })
      ]),
      expect.any(Object)
    )
    expect(jubeeDB.putBulk).toHaveBeenCalledWith('achievements', expect.any(Array))
  })

  it('should batch stickers sync into single network call', async () => {
    const mockStickers = Array.from({ length: 50 }, (_, i) => ({
      id: `sticker-${i}`,
      stickerId: `sticker-${i}`,
      unlockedAt: new Date().toISOString(),
      synced: false
    }))

    vi.mocked(jubeeDB.getUnsynced).mockImplementation(async (store) => {
      if (store === 'stickers') return mockStickers
      return []
    })

    const upsertSpy = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValue({
      upsert: upsertSpy,
      insert: vi.fn().mockResolvedValue({ error: null }),
    } as any)

    await syncService.syncAll()

    expect(upsertSpy).toHaveBeenCalledTimes(1)
    expect(jubeeDB.putBulk).toHaveBeenCalledWith('stickers', expect.any(Array))
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
    } as any)

    await syncService.syncAll()

    // Assuming 50 items limit per batch, 20 items = 1 call
    // If chunking was 10, it would be 2 calls. But code uses 50.
    expect(insertSpy).toHaveBeenCalledTimes(1)
    expect(insertSpy.mock.calls[0][0]).toHaveLength(20)
    expect(jubeeDB.putBulk).toHaveBeenCalledTimes(1)
    expect(jubeeDB.putBulk).toHaveBeenCalledWith('drawings', expect.any(Array))
  })
})
