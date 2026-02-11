import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User } from '@supabase/supabase-js'
import { syncService } from '../lib/syncService'
import { supabase } from '@/integrations/supabase/client'
import { jubeeDB } from '../lib/indexedDB'

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
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
    put: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn(),
  },
}))

describe('SyncService Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'test-user' } as unknown as User },
      error: null,
    })
  })

  it('should call getUser only once during syncAll', async () => {
    // Mock data for each store to ensure loops run if needed
    vi.mocked(jubeeDB.getUnsynced).mockResolvedValue([
      { id: '1', synced: false } as unknown as never,
      { id: '2', synced: false } as unknown as never
    ])

    await syncService.syncAll()

    // It should be called once in syncAll
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(1)
  })

  it('should call getUser only once during processQueue', async () => {
    const mockQueue = [
      { storeName: 'drawings', data: { id: '1' } },
      { storeName: 'achievements', data: { id: '2' } }
    ]

    // We need to mock syncQueue.processQueue or ensure it runs
    // For this test, we can just check syncService.processQueue calls getUser

    await syncService.processQueue()
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(1)
  })
})
