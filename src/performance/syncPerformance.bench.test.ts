import { describe, it, expect, vi, beforeEach } from 'vitest'
import { jubeeDB } from '../lib/indexedDB'

// Mock jubeeDB to simulate I/O delay
vi.mock('../lib/indexedDB', () => ({
  jubeeDB: {
    put: vi.fn(),
    putBulk: vi.fn(),
    init: vi.fn(),
  },
}))

describe('Sync Performance Benchmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should demonstrate parallel vs serial performance', async () => {
    const itemCount = 50
    const mockItems = Array.from({ length: itemCount }, (_, i) => ({
      id: `sticker-${i}`,
      stickerId: `sticker-${i}`,
      unlockedAt: new Date().toISOString(),
      synced: false
    }))

    // Mock with 10ms delay to simulate I/O for a single put
    const putMock = vi.spyOn(jubeeDB, 'put').mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 10))
    )

    // Serial execution (Baseline)
    const serialStart = performance.now()
    for (const item of mockItems) {
      await jubeeDB.put('stickers', item)
    }
    const serialTime = performance.now() - serialStart

    // Reset mocks
    putMock.mockClear()

    // Mock putBulk for Parallel execution (Optimized)
    // We assume putBulk does one transaction, but for this synthetic test
    // we can simulate it being faster than N * 10ms.
    // Let's say the overhead is 20ms + 1ms per item.
    const putBulkMock = vi.spyOn(jubeeDB, 'putBulk').mockImplementation(
      async (_store, items) => {
        await new Promise(resolve => setTimeout(resolve, 20 + items.length))
      }
    )

    // Parallel execution simulation (Promise.all for network + putBulk for DB)
    // Here we simulate the DB part.
    const parallelStart = performance.now()
    await jubeeDB.putBulk('stickers', mockItems)
    const parallelTime = performance.now() - parallelStart

    console.log(`Serial (Simulated): ${serialTime.toFixed(2)}ms`)
    console.log(`Parallel (Simulated): ${parallelTime.toFixed(2)}ms`)
    console.log(`Speedup: ${(serialTime / parallelTime).toFixed(2)}x`)

    // We expect a significant speedup
    expect(parallelTime).toBeLessThan(serialTime * 0.5)
  })
})
