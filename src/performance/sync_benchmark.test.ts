import { describe, it, expect } from 'vitest'

// Simulation constants
const NETWORK_LATENCY_MS = 50
const DB_WRITE_LATENCY_MS = 2

// Mock Supabase Client
const mockSupabase = {
  from: () => ({
    upsert: async () => {
      await new Promise(resolve => setTimeout(resolve, NETWORK_LATENCY_MS))
      return { error: null }
    }
  })
}

// Mock DB
const mockDB = {
  put: async () => {
    await new Promise(resolve => setTimeout(resolve, DB_WRITE_LATENCY_MS))
  },
  putBulk: async (items: unknown[]) => {
    // Bulk put is faster per item usually, but let's say it takes a bit longer total but less than sum
    await new Promise(resolve => setTimeout(resolve, DB_WRITE_LATENCY_MS * 2 + (items.length * 0.1)))
  }
}

// Current Implementation (Serial)
async function serialSync(items: unknown[]) {
  for (const _item of items) {
    // Network request
    await mockSupabase.from().upsert()
    // Local DB update
    await mockDB.put()
  }
}

// Optimized Implementation (Parallel with Batching)
async function parallelSync(items: unknown[]) {
  const BATCH_SIZE = 50

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE)

    // Parallel network requests
    const promises = chunk.map(async (item) => {
       await mockSupabase.from().upsert()
       return item
    })

    const results = await Promise.allSettled(promises)

    // Filter successful items for bulk update
    const successItems = results
      .filter((r): r is PromiseFulfilledResult<unknown> => r.status === 'fulfilled')
      .map(r => r.value)

    if (successItems.length > 0) {
      await mockDB.putBulk(successItems)
    }
  }
}

describe('Sync Performance Benchmark', () => {
  const items10 = Array(10).fill({ id: '1' })
  const items50 = Array(50).fill({ id: '1' })
  const items100 = Array(100).fill({ id: '1' })

  it('Serial Sync (10 items)', async () => {
    const start = performance.now()
    await serialSync(items10)
    const end = performance.now()
    const duration = end - start
    console.log(`Serial Sync (10 items): ${duration.toFixed(2)}ms`)
    // Approx: 10 * (50 + 2) = 520ms
    expect(duration).toBeGreaterThan(500)
  })

  it('Parallel Sync (10 items)', async () => {
    const start = performance.now()
    await parallelSync(items10)
    const end = performance.now()
    const duration = end - start
    console.log(`Parallel Sync (10 items): ${duration.toFixed(2)}ms`)
    // Approx: 50 (max latency) + overhead ~ 60-100ms
    expect(duration).toBeLessThan(200)
  })

  it('Serial Sync (50 items)', async () => {
    const start = performance.now()
    await serialSync(items50)
    const end = performance.now()
    const duration = end - start
    console.log(`Serial Sync (50 items): ${duration.toFixed(2)}ms`)
    // Approx: 50 * 52 = 2600ms
    expect(duration).toBeGreaterThan(2500)
  })

  it('Parallel Sync (50 items)', async () => {
    const start = performance.now()
    await parallelSync(items50)
    const end = performance.now()
    const duration = end - start
    console.log(`Parallel Sync (50 items): ${duration.toFixed(2)}ms`)
    // Approx: 50ms + overhead
    expect(duration).toBeLessThan(300)
  })

  it('Serial Sync (100 items)', async () => {
    const start = performance.now()
    await serialSync(items100)
    const end = performance.now()
    const duration = end - start
    console.log(`Serial Sync (100 items): ${duration.toFixed(2)}ms`)
    // Approx: 100 * 52 = 5200ms
    expect(duration).toBeGreaterThan(5000)
  }, 10000)

  it('Parallel Sync (100 items)', async () => {
    const start = performance.now()
    await parallelSync(items100)
    const end = performance.now()
    const duration = end - start
    console.log(`Parallel Sync (100 items): ${duration.toFixed(2)}ms`)
    // Approx: 2 batches * 50ms = 100ms + overhead
    expect(duration).toBeLessThan(500)
  })
})
