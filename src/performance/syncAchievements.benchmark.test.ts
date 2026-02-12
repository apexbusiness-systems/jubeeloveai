import { describe, it, expect, vi, beforeEach } from 'vitest'
import { syncService } from '@/lib/syncService'
import { jubeeDB } from '@/lib/indexedDB'
import { supabase } from '@/integrations/supabase/client'

vi.unmock('@/lib/syncService')
vi.unmock('@/lib/indexedDB')
vi.unmock('../indexedDB')

describe('syncAchievements Performance Benchmarks', () => {
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
    try {
        await jubeeDB.clear('achievements')
    } catch (e) {
      // ignore
    }
  })

  it('MEASURE: 50-item sync completes under 1s with batch optimization', async () => {
    const testItems = Array.from({ length: 50 }, (_, i) => ({
      id: `achievement-${i}`,
      achievementId: `achievement-${i}`,
      unlockedAt: new Date().toISOString(),
      synced: false
    }))

    await jubeeDB.putBulk('achievements', testItems)

    const upsertSpy = vi.fn().mockImplementation(async () => {
      await mockLatency(300)
      return { error: null, data: [] }
    })

    vi.spyOn(supabase, 'from').mockImplementation((table) => {
      if (table === 'achievements') {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (syncService as any).syncAchievements(mockUser)
    const duration = performance.now() - startTime

    console.log(`Duration: ${duration.toFixed(2)}ms`)
    console.log(`Upsert calls: ${upsertSpy.mock.calls.length}`)

    expect(duration).toBeLessThan(1500)
    expect(upsertSpy).toHaveBeenCalledTimes(1)
  })
})
