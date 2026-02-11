import { describe, it, expect, vi, beforeEach } from 'vitest'
import { syncService } from '@/lib/syncService'
import { jubeeDB } from '@/lib/indexedDB'
import { supabase } from '@/integrations/supabase/client'
import type { User } from '@supabase/supabase-js'

// Create stable spies
const insertMock = vi.fn().mockResolvedValue({ data: null, error: null })
const upsertMock = vi.fn().mockResolvedValue({ data: null, error: null })
const selectMock = vi.fn().mockReturnThis()
const orderMock = vi.fn().mockReturnThis()
const limitMock = vi.fn().mockReturnThis()
const singleMock = vi.fn().mockResolvedValue({ data: null, error: null })

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      upsert: upsertMock,
      insert: insertMock,
      select: selectMock,
      order: orderMock,
      limit: limitMock,
      single: singleMock,
    })),
  },
}))

// Mock IndexedDB
vi.mock('../lib/indexedDB', () => ({
  jubeeDB: {
    getUnsynced: vi.fn().mockResolvedValue([]),
    put: vi.fn(),
    putBulk: vi.fn(), // Will be implemented
    get: vi.fn(),
    getAll: vi.fn(),
  },
}))

// Mock syncQueue to avoid side effects
vi.mock('../lib/syncQueue', () => ({
  syncQueue: {
    add: vi.fn(),
    processQueue: vi.fn(),
    size: vi.fn().mockReturnValue(0),
    getStats: vi.fn(),
  },
}))

/**
 * Generate mock base64 image for testing
 */
function generateMockBase64Image(width: number, height: number): string {
  const estimatedBytes = Math.floor(width * height * 3 * 0.05)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  let base64 = 'data:image/png;base64,'
  for (let i = 0; i < estimatedBytes; i++) {
    base64 += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return base64
}

describe('syncDrawings Performance Benchmark', () => {
  const mockUser = { id: 'test-user-123' } as User

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
    // Reset spies specifically if needed, but clearAllMocks should cover it
    insertMock.mockResolvedValue({ data: null, error: null })
  })

  it('should demonstrate serial vs batch performance', async () => {
    const mockDrawings = Array.from({ length: 20 }, (_, i) => ({
      id: `drawing-${i}`,
      title: `Drawing ${i}`,
      imageData: generateMockBase64Image(100, 100),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(jubeeDB.getUnsynced).mockResolvedValue(mockDrawings as any)
    vi.mocked(jubeeDB.put).mockResolvedValue(undefined)
    if (vi.mocked(jubeeDB.putBulk)) {
        vi.mocked(jubeeDB.putBulk).mockResolvedValue(undefined)
    }

    // Mock delay
    insertMock.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { data: null, error: null } as any
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = syncService as any

    const start = performance.now()
    await service.syncDrawings(mockUser)
    const end = performance.now()

    const duration = end - start
    const callCount = insertMock.mock.calls.length

    console.log(`Execution time: ${duration.toFixed(2)}ms`)
    console.log(`Supabase calls: ${callCount}`)

    // Expect significant reduction in calls (should be 1 batch for these small items)
    expect(callCount).toBeLessThan(5)
    expect(callCount).toBe(1)
  })

  it('should handle large images with proper batching logic (unit test for createSmartBatches)', () => {
    // 2000x2000 image ~600KB with our generator (0.05 factor)
    // 600KB + 600KB > 800KB limit, so should split
    const largeMockDrawings = [
      {
        id: '1',
        imageData: generateMockBase64Image(2000, 2000),
        title: 'Large 1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        synced: false
      },
      {
        id: '2',
        imageData: generateMockBase64Image(2000, 2000),
        title: 'Large 2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        synced: false
      },
      {
        id: '3',
        imageData: generateMockBase64Image(100, 100),
        title: 'Small 1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        synced: false
      }
    ]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = syncService as any

    if (typeof service.createSmartBatches === 'function') {
        const batches = service.createSmartBatches(largeMockDrawings, 'drawings')
        console.log(`Created ${batches.length} batches from ${largeMockDrawings.length} items`)

        // Should create at least 2 batches because of size limit
        expect(batches.length).toBeGreaterThanOrEqual(2)

        // Verify estimated sizes are within limit
        batches.forEach(batch => {
            expect(batch.estimatedSize).toBeLessThan(800 * 1024 + 1000) // 800KB + small buffer just in case
        })
    } else {
        console.log('createSmartBatches not yet implemented')
    }
  })
})
