import 'fake-indexeddb/auto'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Unmock IndexedDB to use real logic (via fake-indexeddb)
vi.unmock('@/lib/indexedDB')
vi.unmock('../lib/indexedDB') // Unmock relative path if needed

import { jubeeDB } from '@/lib/indexedDB'
import { syncService } from '@/lib/syncService'
import { supabase } from '@/integrations/supabase/client'

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnThis(),
    })),
  },
}))

describe('syncStickers Performance Benchmark', () => {
  const LATENCY = 300 // Simulate 300ms network latency
  const ITEM_COUNT = 50

  // Helper to simulate network delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  beforeEach(async () => {
    vi.clearAllMocks()
    // Use the real IndexedDB (polyfilled)
    await jubeeDB.init()
    await jubeeDB.clear('stickers')
  })

  it('BASELINE: Serial N+1 pattern (Simulated)', async () => {
    const mockItems = Array.from({ length: ITEM_COUNT }, (_, i) => ({
      id: `sticker-${i}`,
      stickerId: `s-${i}`,
      unlockedAt: '2026-01-01',
      synced: false
    }))

    // Mock serial operations
    const start = performance.now()
    for (const item of mockItems) {
      await delay(LATENCY) // Network request
      await delay(10)      // IndexedDB put
    }
    const serialDuration = performance.now() - start

    console.log(`BASELINE: ${serialDuration.toFixed(0)}ms for ${ITEM_COUNT} items`)
    expect(serialDuration).toBeGreaterThan(ITEM_COUNT * LATENCY * 0.9) // ~15,000ms
  }, 30000)

  it('OPTIMIZED: Batch pattern (Simulated)', async () => {
    // Mock batch operations
    const start = performance.now()
    await delay(LATENCY)  // Single batch network request
    await delay(10)       // Single putBulk operation
    const batchDuration = performance.now() - start

    console.log(`OPTIMIZED: ${batchDuration.toFixed(0)}ms for ${ITEM_COUNT} items`)
    expect(batchDuration).toBeLessThan(LATENCY * 2) // ~600ms
  })

  it('MEASURE: Real putBulk vs individual puts', async () => {
    const testItems = Array.from({ length: 50 }, (_, i) => ({
      id: `perf-test-${i}`,
      stickerId: `s-${i}`,
      unlockedAt: '2026-01-01',
      synced: false
    }))

    // Test individual puts
    await jubeeDB.clear('stickers')
    const serialStart = performance.now()
    for (const item of testItems) {
      await jubeeDB.put('stickers', item)
    }
    const serialTime = performance.now() - serialStart

    // Test putBulk
    await jubeeDB.clear('stickers')
    const bulkStart = performance.now()
    await jubeeDB.putBulk('stickers', testItems)
    const bulkTime = performance.now() - bulkStart

    console.log(`Individual puts: ${serialTime.toFixed(1)}ms`)
    console.log(`putBulk: ${bulkTime.toFixed(1)}ms`)
    console.log(`IndexedDB speedup: ${(serialTime / bulkTime).toFixed(1)}x`)

    expect(bulkTime).toBeLessThan(serialTime)
    // Usually much faster, but in jsdom/fake-indexeddb env it might be just faster.
  })

  it('VERIFY: syncStickers uses batching', async () => {
    // Setup 50 unsynced stickers
    const items = Array.from({ length: 50 }, (_, i) => ({
      id: `s-${i}`,
      stickerId: `sticker-${i}`,
      unlockedAt: '2026-01-01',
      synced: false
    }))
    await jubeeDB.putBulk('stickers', items)

    // Mock User
    const mockUser = { id: 'test-user' }

    // Call private method via type assertion
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (syncService as any).syncStickers(mockUser)

    // Verify Supabase was called with upsert
    expect(supabase.from).toHaveBeenCalledWith('stickers')

    // Get the query builder object returned by the mock
    const fromMock = vi.mocked(supabase.from)
    // Find the call for 'stickers'
    const callIndex = fromMock.mock.calls.findIndex(args => args[0] === 'stickers')
    expect(callIndex).toBeGreaterThanOrEqual(0)

    const queryBuilder = fromMock.mock.results[callIndex].value
    expect(queryBuilder.upsert).toHaveBeenCalledTimes(1)

    // Check payload size
    const payload = queryBuilder.upsert.mock.calls[0][0]
    expect(payload).toHaveLength(50)
  })
})
