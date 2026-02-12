import { describe, it, expect, vi } from 'vitest'
import { jubeeDB } from '@/lib/indexedDB'

// Unmock to test real implementation (or fallback)
vi.unmock('@/lib/indexedDB')

describe('Conflict Resolution Performance', () => {
  it('MEASURE: putBulk vs individual put operations', async () => {
    // Setup test items
    const testItems = Array.from({ length: 50 }, (_, i) => ({
      id: `benchmark-${i}`,
      title: `Drawing ${i}`,
      imageData: `data-${i}`,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      synced: false
    }))

    // Ensure clean state
    try { await jubeeDB.clear('drawings') } catch (e) { /* ignore */ }

    // BASELINE: Individual operations
    const serialStart = performance.now()
    for (const item of testItems) {
      await jubeeDB.put('drawings', item)
    }
    const serialDuration = performance.now() - serialStart

    // Clear for next test
    try { await jubeeDB.clear('drawings') } catch (e) { /* ignore */ }

    // OPTIMIZED: Bulk operation
    const bulkStart = performance.now()
    await jubeeDB.putBulk('drawings', testItems)
    const bulkDuration = performance.now() - bulkStart

    console.log(`Serial: ${serialDuration.toFixed(2)}ms`)
    console.log(`Bulk: ${bulkDuration.toFixed(2)}ms`)
    console.log(`Speedup: ${(serialDuration/bulkDuration).toFixed(2)}x`)

    expect(bulkDuration).toBeLessThan(serialDuration)
  })
})
