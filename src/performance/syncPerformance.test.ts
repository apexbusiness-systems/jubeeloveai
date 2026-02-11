import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User } from '@supabase/supabase-js'
import { syncService } from '../lib/syncService'
import { supabase } from '@/integrations/supabase/client'
import { jubeeDB } from '../lib/indexedDB'

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
    putBulk: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn(),
  },
}))

describe('SyncService Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'test-user' } as unknown as User },
      error: null,
    })
  })

  it('should call getUser only once during syncAll', async () => {
    // Mock data for each store to ensure loops run if needed
    vi.mocked(jubeeDB.getUnsynced).mockResolvedValue([
      { id: '1', synced: false } as unknown as never,
      { id: '2', synced: false } as unknown as never
    ])

    await syncService.syncAll()

    // It should be called once in syncAll
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(1)
  })

  it('should call getUser only once during processQueue', async () => {
    // We need to mock syncQueue.processQueue or ensure it runs
    // For this test, we can just check syncService.processQueue calls getUser

    await syncService.processQueue()
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(1)
  })

  it('should batch achievements sync into single network call', async () => {
    const mockAchievements = Array.from({ length: 50 }, (_, i) => ({
      id: `ach-${i}`,
      achievementId: `achievement-${i}`,
      unlockedAt: new Date().toISOString(),
      synced: false
    }))

    // Ensure we only return achievements for the 'achievements' store
    vi.mocked(jubeeDB.getUnsynced).mockImplementation(async (store) => {
      if (store === 'achievements') return mockAchievements as never
      return [] as never
    })

    const upsertSpy = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValue({
      upsert: upsertSpy,
    } as any)

    await syncService.syncAll()

    // Should call getUser once (existing optimization)
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(1)

    // NEW: Should call upsert once with batch (new optimization)
    // We expect it to be called with an array containing all items
    expect(upsertSpy).toHaveBeenCalledTimes(1)
    expect(upsertSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ achievement_id: 'achievement-0' }),
        expect.objectContaining({ achievement_id: 'achievement-49' })
      ]),
      expect.any(Object)
    )
  })

  it('should batch stickers sync into single network call', async () => {
    const mockStickers = Array.from({ length: 50 }, (_, i) => ({
      id: `sticker-${i}`,
      stickerId: `sticker-${i}`,
      unlockedAt: new Date().toISOString(),
      synced: false
    }))

    // Ensure we only return stickers for the 'stickers' store
    vi.mocked(jubeeDB.getUnsynced).mockImplementation(async (store) => {
      if (store === 'stickers') return mockStickers as never
      return [] as never
    })

    const upsertSpy = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValue({
      upsert: upsertSpy,
    } as any)

    await syncService.syncAll()

    // Should call getUser once (existing optimization)
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(1)

    // NEW: Should call upsert once with batch (new optimization)
    // We expect it to be called with an array containing all items
    expect(upsertSpy).toHaveBeenCalledTimes(1)
    expect(upsertSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ sticker_id: 'sticker-0' }),
        expect.objectContaining({ sticker_id: 'sticker-49' })
      ]),
      expect.any(Object)
    )
  })
})
