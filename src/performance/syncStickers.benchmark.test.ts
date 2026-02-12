import { describe, it, expect, vi, beforeEach } from 'vitest'
import { syncService } from '../lib/syncService'
import { jubeeDB } from '../lib/indexedDB'
import { supabase } from '@/integrations/supabase/client'
import type { User } from '@supabase/supabase-js'

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ error: null, data: [] }),
      insert: vi.fn().mockResolvedValue({ error: null, data: [] }),
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
    put: vi.fn().mockResolvedValue(undefined),
    get: vi.fn(),
    getAll: vi.fn(),
    putBulk: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('syncStickers Performance Benchmarks', () => {
  const mockLatency = (ms: number) =>
    new Promise(resolve => setTimeout(resolve, ms))

  const mockUser = { id: 'test-user' } as unknown as User

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
  })

  it('measures sync performance', async () => {
    // Generate test data - 50 items
    const testStickers = Array.from({ length: 50 }, (_, i) => ({
      id: `sticker-${i}`,
      stickerId: `sticker-${i}`,
      unlockedAt: new Date().toISOString(),
      synced: false
    }))

    // Mock getUnsynced to return our test data
    vi.mocked(jubeeDB.getUnsynced).mockImplementation(async (store) => {
        if (store === 'stickers') return testStickers as unknown as never
        return []
    })

    // Mock latency
    const LATENCY = 20
    const upsertMock = vi.fn().mockImplementation(async () => {
        await mockLatency(LATENCY)
        return { error: null, data: [] }
    })

    vi.mocked(supabase.from).mockReturnValue({
        upsert: upsertMock,
        insert: vi.fn().mockResolvedValue({ error: null }),
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as unknown as ReturnType<typeof supabase.from>)

    const startTime = performance.now()

    // Access private method for testing purposes
    await (syncService as unknown as { syncStickers: (user: User) => Promise<void> }).syncStickers(mockUser)

    const duration = performance.now() - startTime

    const upsertCalls = upsertMock.mock.calls.length

    console.log(`Sync duration: ${duration.toFixed(2)}ms`)
    console.log(`Upsert calls: ${upsertCalls}`)

    // Expect 1 call (batch) instead of 50
    expect(upsertCalls).toBe(1)
  })
})
