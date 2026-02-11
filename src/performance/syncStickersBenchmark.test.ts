import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User } from '@supabase/supabase-js'
import { syncService } from '../lib/syncService'
import { supabase } from '@/integrations/supabase/client'
import { jubeeDB } from '../lib/indexedDB'

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

describe('SyncService Performance Baseline - Stickers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'test-user' } as unknown as User },
      error: null,
    })
  })

  it('should make 1 batch upsert call for N stickers (Optimized)', async () => {
    // Simulate 50 unsynced stickers
    const unsyncedStickers = Array.from({ length: 50 }, (_, i) => ({
      id: `sticker-${i}`,
      stickerId: `s${i}`,
      unlockedAt: new Date().toISOString(),
      synced: false,
    }))

    vi.mocked(jubeeDB.getUnsynced).mockImplementation(async (storeName) => {
      if (storeName === 'stickers') {
        return unsyncedStickers as unknown as []
      }
      return []
    })

    // We need to spy on the upsert call specifically
    const upsertSpy = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValue({
      upsert: upsertSpy,
    } as unknown as ReturnType<typeof supabase.from>)

    // Run syncAll which includes syncStickers
    await syncService.syncAll()

    // VERIFICATION: Expected to be 1 call (Batch optimization)
    expect(upsertSpy).toHaveBeenCalledTimes(1)

    // Verify the arguments of the call to ensure it's a batch
    const calledArg = upsertSpy.mock.calls[0][0]
    expect(Array.isArray(calledArg)).toBe(true)
    expect(calledArg).toHaveLength(50)
  })
})
