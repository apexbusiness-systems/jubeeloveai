
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { syncService } from './syncService'
import { supabase } from '@/integrations/supabase/client'
import { jubeeDB } from './indexedDB'

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}))

vi.mock('./indexedDB', () => ({
  jubeeDB: {
    put: vi.fn(),
    putBulk: vi.fn().mockResolvedValue(undefined),
    get: vi.fn(),
  },
  conflictResolver: {
      detectConflicts: vi.fn(),
      addConflict: vi.fn(),
  }
}))

vi.mock('./logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    dev: vi.fn(),
  }
}))

describe('SyncService.pullFromSupabase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'test-user' } } as any },
      error: null,
    })

    // Ensure isOnline returns true
    Object.defineProperty(navigator, 'onLine', {
        value: true,
        configurable: true
    });
  })

  it('should pull achievements, stickers, and drawings using bulk operations', async () => {
    const mockAchievements = [{ id: '1', achievement_id: 'a1', unlocked_at: '2023-01-01' }]
    const mockStickers = [{ id: '2', sticker_id: 's1', unlocked_at: '2023-01-02' }]
    const mockDrawings = [{ id: '3', title: 'd1', image_data: 'img', created_at: '2023-01-03', updated_at: '2023-01-03' }]

    vi.mocked(supabase.from).mockImplementation((table: string) => {
        let resultData: any[] = [];
        if (table === 'achievements') resultData = mockAchievements;
        else if (table === 'stickers') resultData = mockStickers;
        else if (table === 'drawings') resultData = mockDrawings;
        else if (table === 'game_progress') return {
             select: vi.fn().mockReturnThis(),
             order: vi.fn().mockReturnThis(),
             limit: vi.fn().mockReturnThis(),
             single: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any;

        const chain: any = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null }),
            then: (resolve: any) => resolve({ data: resultData, error: null })
        }
        return chain
    })

    await syncService.pullFromSupabase()

    // Check if putBulk was called for each store
    expect(jubeeDB.putBulk).toHaveBeenCalledTimes(3)

    // Verify achievements call
    expect(jubeeDB.putBulk).toHaveBeenCalledWith('achievements', expect.arrayContaining([
        expect.objectContaining({ id: '1', achievementId: 'a1', synced: true })
    ]))

    // Verify stickers call
    expect(jubeeDB.putBulk).toHaveBeenCalledWith('stickers', expect.arrayContaining([
        expect.objectContaining({ id: '2', stickerId: 's1', synced: true })
    ]))

    // Verify drawings call
    expect(jubeeDB.putBulk).toHaveBeenCalledWith('drawings', expect.arrayContaining([
        expect.objectContaining({ id: '3', title: 'd1', synced: true })
    ]))
  })
})
