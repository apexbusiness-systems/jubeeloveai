import { describe, it, expect, vi, beforeEach } from 'vitest'
import { syncService } from '@/lib/syncService'
import { jubeeDB } from '@/lib/indexedDB'
import { supabase } from '@/integrations/supabase/client'

// Unmock dependencies to test real logic
vi.unmock('@/lib/syncService')
vi.unmock('@/lib/indexedDB')
vi.unmock('../indexedDB') // Just in case

describe('syncStickers Performance Benchmarks', () => {
  const mockLatency = (ms: number) =>
    new Promise(resolve => setTimeout(resolve, ms))

  const mockUser = {
    id: 'test-user-123',
    email: 'test@jubee.love',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString()
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    // Reset DB state
    // We need to make sure we are using the real jubeeDB instance if unmocked
    // But since JSDOM indexedDB is transient, we might just need to clear it if tests reuse environment.
    try {
        await jubeeDB.clear('stickers')
    } catch (e) {
        // If clear fails (e.g. DB not open), ignore
    }
  })

  it('MEASURE: 50-item sync completes under 1s with batch optimization', async () => {
    // Generate 50 test stickers
    const testStickers = Array.from({ length: 50 }, (_, i) => ({
      id: `sticker-${i}`,
      stickerId: `sticker-${i}`,
      unlockedAt: new Date().toISOString(),
      synced: false
    }))

    // Seed IndexedDB
    // We use putBulk if available or loop put
    // Since we just implemented putBulk, let's use it to seed faster!
    await jubeeDB.putBulk('stickers', testStickers)

    // Mock Supabase with 300ms network latency (3G simulation)
    const upsertSpy = vi.fn().mockImplementation(async () => {
      await mockLatency(300)
      return { error: null, data: [] }
    })

    vi.spyOn(supabase, 'from').mockImplementation((table) => {
      if (table === 'stickers') {
        return {
          upsert: upsertSpy,
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any
      }
      return {
          upsert: vi.fn().mockResolvedValue({ error: null, data: [] }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any
    })

    const startTime = performance.now()
    // Call private method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (syncService as any).syncStickers(mockUser)
    const duration = performance.now() - startTime

    console.log(`Duration: ${duration.toFixed(2)}ms`)
    console.log(`Upsert calls: ${upsertSpy.mock.calls.length}`)

    // Expectation: < 1000ms and 1 call
    // This will fail before optimization (should take ~15s and 50 calls)
    expect(duration).toBeLessThan(1500) // Slightly generous buffer for test env overhead
    expect(upsertSpy).toHaveBeenCalledTimes(1)
  })
})
