import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User } from '@supabase/supabase-js'
import { syncService } from '../lib/syncService'
import { supabase } from '@/integrations/supabase/client'
import { jubeeDB } from '../lib/indexedDB'
import { syncQueue } from '../lib/syncQueue'

// Create shared mock functions
const mockUpsert = vi.fn().mockResolvedValue({ error: null })
const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockSelect = vi.fn().mockReturnThis()
const mockOrder = vi.fn().mockReturnThis()
const mockLimit = vi.fn().mockReturnThis()
const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null })

const mockQueryBuilder = {
  upsert: mockUpsert,
  insert: mockInsert,
  select: mockSelect,
  order: mockOrder,
  limit: mockLimit,
  single: mockSingle,
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(() => mockQueryBuilder),
  },
}))

vi.mock('../lib/indexedDB', () => ({
  jubeeDB: {
    getUnsynced: vi.fn().mockResolvedValue([]),
    put: vi.fn(),
    putBulk: vi.fn(), // We will add this later
    get: vi.fn(),
    getAll: vi.fn(),
  },
}))

describe('Sync Batch Optimization', () => {
  const mockUser = { id: 'test-user-id' } as User

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
    // Reset implementations
    mockUpsert.mockResolvedValue({ error: null })
    vi.mocked(jubeeDB.put).mockResolvedValue(undefined)
  })

  describe('Phase 1: Stickers', () => {
    it('should batch sync 50 stickers in single call', async () => {
      const mockStickers = Array.from({ length: 50 }, (_, i) => ({
        id: `sticker-${i}`,
        stickerId: `sticker-id-${i}`,
        unlockedAt: new Date().toISOString(),
        synced: false
      }))

      vi.mocked(jubeeDB.getUnsynced).mockImplementation(async (storeName) => {
        if (storeName === 'stickers') return mockStickers
        return []
      })

      await syncService.syncAll()

      // Should call upsert ONCE with array of 50 items
      const batchCall = mockUpsert.mock.calls.find(call => Array.isArray(call[0]) && call[0].length === 50)

      // Strict expectation: Must rely on batching
      expect(batchCall).toBeDefined()
      expect(mockUpsert).toHaveBeenCalledTimes(1)
    })

    it('should fallback to individual on data error', async () => {
      const mockStickers = Array.from({ length: 3 }, (_, i) => ({
        id: `sticker-${i}`,
        stickerId: `sticker-id-${i}`,
        unlockedAt: new Date().toISOString(),
        synced: false
      }))

      vi.mocked(jubeeDB.getUnsynced).mockImplementation(async (storeName) => {
        if (storeName === 'stickers') return mockStickers
        return []
      })

      let callCount = 0
      mockUpsert.mockImplementation(async (args) => {
        callCount++
        // If it's the batch call (array)
        if (Array.isArray(args)) {
          return { error: { code: '23505', message: 'duplicate key' } }
        }
        // Individual calls succeed
        return { error: null }
      })

      await syncService.syncAll()

      // 1 batch call (failed) + 3 individual calls = 4 calls total
      expect(mockUpsert).toHaveBeenCalledTimes(4)
      // First call should be batch
      expect(Array.isArray(mockUpsert.mock.calls[0][0])).toBe(true)
    })

    it('should queue batch retry on transient error', async () => {
        const mockStickers = Array.from({ length: 50 }, (_, i) => ({
          id: `sticker-${i}`,
          stickerId: `sticker-id-${i}`,
          unlockedAt: new Date().toISOString(),
          synced: false
        }))

        vi.mocked(jubeeDB.getUnsynced).mockImplementation(async (storeName) => {
          if (storeName === 'stickers') return mockStickers
          return []
        })

        mockUpsert.mockResolvedValue({
          error: { message: 'Network timeout', code: 'ETIMEDOUT' }
        })

        const queueSpy = vi.spyOn(syncQueue, 'add')

        await syncService.syncAll()

        // Should NOT fallback to individual, so only 1 call (the batch attempt)
        expect(mockUpsert).toHaveBeenCalledTimes(1)

        // Should queue for retry
        expect(queueSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            storeName: 'stickers',
            operation: 'sync_batch'
          })
        )
      })
  })
})
