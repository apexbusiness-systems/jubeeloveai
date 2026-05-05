import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User } from '@supabase/supabase-js'
import { syncService } from '../lib/syncService'
import { supabase } from '@/integrations/supabase/client'
import { jubeeDB } from '../lib/indexedDB'

const { mockInsert, mockFrom } = vi.hoisted(() => {
  const mockInsert = vi.fn().mockResolvedValue({ error: null })
  const mockFrom = vi.fn().mockReturnValue({
    upsert: vi.fn().mockResolvedValue({ error: null }),
    insert: mockInsert,
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  })
  return { mockInsert, mockFrom }
})

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: mockFrom,
  },
}))

vi.mock('../lib/indexedDB', () => ({
  jubeeDB: {
    getUnsynced: vi.fn().mockResolvedValue([]),
    put: vi.fn(),
    putBulk: vi.fn(),
  },
}))

vi.mock('../lib/syncQueue', () => ({
  syncQueue: {
    add: vi.fn(),
  },
}))

describe('SyncService Drawings/Progress Optimization', () => {
  const mockUser = { id: 'test-user-id' }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as unknown as User },
      error: null,
    })
    mockInsert.mockClear()
    mockFrom.mockClear()
  })

  it('syncDrawings should use parallel requests and putBulk', async () => {
    const drawings = Array.from({ length: 5 }, (_, i) => ({
      id: `drawing-${i}`,
      title: `Drawing ${i}`,
      imageData: 'data:image/png;base64,...',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
    }))

    vi.mocked(jubeeDB.getUnsynced).mockImplementation(async (store) => {
      if (store === 'drawings') return drawings
      return []
    })

    await syncService.syncAll()

    expect(mockFrom).toHaveBeenCalledWith('drawings')
    expect(mockInsert).toHaveBeenCalledTimes(5)

    expect(jubeeDB.putBulk).toHaveBeenCalledWith('drawings', expect.any(Array))
    expect(jubeeDB.putBulk).toHaveBeenCalledTimes(1)
  })
})
