import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
  },
}))

describe('Performance Benchmark: Auth Check in Loop', () => {
  const ITEMS_COUNT = 100
  const MOCK_LATENCY = 10 // 10ms simulated network latency per call

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock getUser with latency
    vi.mocked(supabase.auth.getUser).mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, MOCK_LATENCY))
      return {
        data: { user: { id: 'test-user' } as unknown as User },
        error: null,
      }
    })
  })

  it('should be significantly faster when getUser is called outside the loop', async () => {
    const items = Array.from({ length: ITEMS_COUNT }, (_, i) => ({ id: i }))

    // --- Scenario 1: Unoptimized (getUser inside loop) ---
    const startUnoptimized = performance.now()

    for (const item of items) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) continue
      // Simulate some work using item and user
      const _work = `${item.id}-${user.id}`
    }

    const endUnoptimized = performance.now()
    const durationUnoptimized = endUnoptimized - startUnoptimized

    // --- Scenario 2: Optimized (getUser outside loop) ---
    const startOptimized = performance.now()

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      for (const item of items) {
        // Simulate same work
        const _work = `${item.id}-${user.id}`
      }
    }

    const endOptimized = performance.now()
    const durationOptimized = endOptimized - startOptimized

    // Log results
    console.log(`\n--- Performance Benchmark Results ---`)
    console.log(`Items: ${ITEMS_COUNT}`)
    console.log(`Mock Latency: ${MOCK_LATENCY}ms`)
    console.log(`Unoptimized (getUser inside loop): ${durationUnoptimized.toFixed(2)}ms`)
    console.log(`Optimized (getUser outside loop):   ${durationOptimized.toFixed(2)}ms`)
    console.log(`Speedup Factor: ${(durationUnoptimized / durationOptimized).toFixed(2)}x`)
    console.log(`-----------------------------------\n`)

    // Assertions
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(ITEMS_COUNT + 1) // 100 + 1

    // The optimized version should be much faster.
    // Theoretical unoptimized time ~= 100 * 10ms = 1000ms
    // Theoretical optimized time ~= 1 * 10ms = 10ms
    // Allow for some overhead, but it should be at least 50x faster.
    expect(durationOptimized).toBeLessThan(durationUnoptimized / 50)
  })
})
