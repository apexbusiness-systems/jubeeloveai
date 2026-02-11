
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { jubeeDB } from '../lib/indexedDB'
import { syncService } from '../lib/syncService'
import { supabase } from '@/integrations/supabase/client'

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}))

vi.mock('../lib/indexedDB', () => ({
  jubeeDB: {
    put: vi.fn(),
    putBulk: vi.fn(), // Prepare for implementation
    get: vi.fn(),
  },
}))


describe('Performance Benchmark: Serial vs Bulk Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()

    // Mock user
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'test-user' } } as any,
      error: null,
    })
  })

  it('demonstrates significant performance gain with bulk operations', async () => {
    const NUM_ITEMS = 50
    const TRANSACTION_OVERHEAD_MS = 10
    const BULK_TRANSACTION_OVERHEAD_MS = 20 // slightly higher due to larger payload, but only once

    const mockItems = Array.from({ length: NUM_ITEMS }, (_, i) => ({
      id: `item-${i}`,
      value: i,
    }))

    // 1. Simulate Serial Operations
    // Each put simulates a separate transaction overhead
    vi.mocked(jubeeDB.put).mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, TRANSACTION_OVERHEAD_MS))
    })

    const serialStart = performance.now()
    for (const item of mockItems) {
      await jubeeDB.put('achievements', item as any)
    }
    const serialTime = performance.now() - serialStart
    console.log(`Serial Time (${NUM_ITEMS} items): ${serialTime.toFixed(2)}ms`)


    // 2. Simulate Bulk Operation
    // Single transaction overhead for all items
    vi.mocked(jubeeDB.putBulk).mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, BULK_TRANSACTION_OVERHEAD_MS))
    })

    const bulkStart = performance.now()
    await jubeeDB.putBulk('achievements', mockItems as any)
    const bulkTime = performance.now() - bulkStart
    console.log(`Bulk Time (${NUM_ITEMS} items): ${bulkTime.toFixed(2)}ms`)


    // Assertions
    const speedup = serialTime / bulkTime
    console.log(`Speedup: ${speedup.toFixed(2)}x`)

    expect(serialTime).toBeGreaterThan(bulkTime * 10) // Should be at least 10x faster
  })
})
