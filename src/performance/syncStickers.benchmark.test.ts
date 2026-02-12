import { describe, it, expect, vi, beforeEach } from 'vitest'
import { syncService } from '@/lib/syncService'
import { jubeeDB } from '@/lib/indexedDB'
import { supabase } from '@/integrations/supabase/client'
import type { User } from '@supabase/supabase-js'

// Use vi.hoisted to share the mock between the factory and the test
const { mockUpsert } = vi.hoisted(() => {
  return { mockUpsert: vi.fn() }
})

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      upsert: mockUpsert,
      insert: vi.fn().mockResolvedValue({ error: null, data: [] }),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}))

// Mock IndexedDB
vi.mock('@/lib/indexedDB', () => ({
  jubeeDB: {
    getUnsynced: vi.fn().mockResolvedValue([]),
    put: vi.fn().mockResolvedValue(undefined),
    get: vi.fn(),
    getAll: vi.fn(),
    putBulk: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('syncStickers Performance Benchmarks', () => {
  const mockLatency = (ms: number) =>
    new Promise(resolve => setTimeout(resolve, ms))

  const mockUser = { id: 'test-user-123', email: 'test@jubee.love' } as unknown as User

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
    // Reset mockUpsert default implementation
    mockUpsert.mockResolvedValue({ error: null, data: [] })
  })

  it('MEASURE: 50-item sync completes under 1s with batch optimization', async () => {
    const testStickers = Array.from({ length: 50 }, (_, i) => ({
      id: `sticker-${i}`,
      stickerId: `sticker-${i}`,
      unlockedAt: new Date().toISOString(),
      synced: false
    }))

    // Mock getUnsynced to return our test stickers
    vi.mocked(jubeeDB.getUnsynced).mockImplementation(async (store) => {
        if (store === 'stickers') return testStickers as unknown as ReturnType<typeof jubeeDB.getUnsynced>
        return []
    })

    // Mock 300ms network latency (3G simulation) for the upsert call
    mockUpsert.mockImplementation(async () => {
        await mockLatency(300)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { error: null, data: [] } as any
    })

    const startTime = performance.now()
    await syncService.syncAll()
    const duration = performance.now() - startTime

    console.log(`Duration: ${duration}ms`)
    console.log(`Upsert calls: ${mockUpsert.mock.calls.length}`)

    expect(duration).toBeLessThan(1000)
    expect(mockUpsert).toHaveBeenCalledTimes(1)
  })
})
