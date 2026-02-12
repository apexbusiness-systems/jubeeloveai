import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User } from '@supabase/supabase-js'
import { syncService } from '../lib/syncService'
import { supabase } from '@/integrations/supabase/client'
import { jubeeDB } from '../lib/indexedDB'

const { mockUpsert, mockInsert, mockFrom } = vi.hoisted(() => {
  const mockUpsert = vi.fn().mockResolvedValue({ error: null })
  const mockInsert = vi.fn().mockResolvedValue({ error: null })
  const mockFrom = vi.fn().mockReturnValue({
    upsert: mockUpsert,
    insert: mockInsert,
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  })
  return { mockUpsert, mockInsert, mockFrom }
})

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: mockFrom,
  },
}))

vi.mock('../lib/indexedDB', () => ({
  jubeeDB: {
    getUnsynced: vi.fn().mockResolvedValue([]),
    put: vi.fn(),
    putBulk: vi.fn(),
  },
}))

vi.mock('../lib/syncQueue', () => ({
  syncQueue: {
    add: vi.fn(),
  },
}))

describe('SyncService Batch Optimization', () => {
  const mockUser = { id: 'test-user-id' }
  const BATCH_SIZE = 50

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as unknown as User },
      error: null,
    })
    // Reset mock implementation specific to this test file if needed
    mockUpsert.mockClear()
    mockInsert.mockClear()
    mockFrom.mockClear()
  })

  it('syncStickers should use batch processing', async () => {
    // Setup 50 unsynced stickers
    const stickers = Array.from({ length: BATCH_SIZE }, (_, i) => ({
      id: `sticker-${i}`,
      stickerId: `sticker-id-${i}`,
      unlockedAt: new Date().toISOString(),
      synced: false,
    }))

    vi.mocked(jubeeDB.getUnsynced).mockImplementation(async (store) => {
      if (store === 'stickers') return stickers
      return []
    })

    await syncService.syncAll()

    // Assert upsert was called with an array of 50 items
    expect(mockFrom).toHaveBeenCalledWith('stickers')

    // We expect ONE call with array of 50
    const upsertCalls = mockUpsert.mock.calls
    const batchCall = upsertCalls.find(args => Array.isArray(args[0]) && args[0].length === BATCH_SIZE)
    expect(batchCall).toBeTruthy()

    // Assert putBulk was called
    expect(jubeeDB.putBulk).toHaveBeenCalledWith('stickers', expect.any(Array))
    expect(jubeeDB.putBulk).toHaveBeenCalledTimes(1)
  })

  it('syncAchievements should use batch processing', async () => {
    const achievements = Array.from({ length: BATCH_SIZE }, (_, i) => ({
      id: `achievement-${i}`,
      achievementId: `achievement-id-${i}`,
      unlockedAt: new Date().toISOString(),
      synced: false,
    }))

    vi.mocked(jubeeDB.getUnsynced).mockImplementation(async (store) => {
      if (store === 'achievements') return achievements
      return []
    })

    await syncService.syncAll()

    expect(mockFrom).toHaveBeenCalledWith('achievements')
    const batchCall = mockUpsert.mock.calls.find(args => Array.isArray(args[0]) && args[0].length === BATCH_SIZE)
    expect(batchCall).toBeTruthy()

    expect(jubeeDB.putBulk).toHaveBeenCalledWith('achievements', expect.any(Array))
    expect(jubeeDB.putBulk).toHaveBeenCalledTimes(1)
  })
})
