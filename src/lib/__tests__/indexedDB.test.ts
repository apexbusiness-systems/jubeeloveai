import { describe, it, expect, vi, beforeEach } from 'vitest'

// Unmock the module so we test the real implementation
vi.unmock('../indexedDB')
vi.unmock('@/lib/indexedDB')

import { jubeeDB } from '../indexedDB'

// Mock logger to avoid cluttering test output
vi.mock('../logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }
}))

describe('IndexedDB Service - putBulk', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should insert multiple records in single transaction', async () => {
    const putSpy = vi.fn()
    const transactionMock = {
      objectStore: vi.fn().mockReturnValue({ put: putSpy }),
      oncomplete: null as (() => void) | null,
      onerror: null as (() => void) | null,
    }

    const dbMock = {
      transaction: vi.fn().mockReturnValue(transactionMock)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(jubeeDB as any, 'init').mockResolvedValue(dbMock)

    const items = [
      { id: '1', stickerId: 's1', unlockedAt: '2026-01-01', synced: false },
      { id: '2', stickerId: 's2', unlockedAt: '2026-01-02', synced: false }
    ]

    const promise = jubeeDB.putBulk('stickers', items)

    // Wait for microtasks so putBulk reaches transaction creation
    await new Promise(resolve => setTimeout(resolve, 0))

    // Trigger success
    if (transactionMock.oncomplete) {
      transactionMock.oncomplete()
    }

    await promise

    expect(dbMock.transaction).toHaveBeenCalledWith(['stickers'], 'readwrite')
    expect(putSpy).toHaveBeenCalledTimes(2)
    expect(putSpy).toHaveBeenCalledWith(items[0])
    expect(putSpy).toHaveBeenCalledWith(items[1])
  })

  it('should handle empty array gracefully', async () => {
    const transactionMock = {
      objectStore: vi.fn().mockReturnValue({ put: vi.fn() }),
      oncomplete: null as (() => void) | null,
    }
    const dbMock = {
      transaction: vi.fn().mockReturnValue(transactionMock)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(jubeeDB as any, 'init').mockResolvedValue(dbMock)

    const promise = jubeeDB.putBulk('stickers', [])

    // Wait for microtasks so putBulk reaches transaction creation
    await new Promise(resolve => setTimeout(resolve, 0))

    if (transactionMock.oncomplete) transactionMock.oncomplete()

    await expect(promise).resolves.not.toThrow()
  })

  it('should fallback to localStorage on IndexedDB failure', async () => {
    // Mock IndexedDB failure
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(jubeeDB as any, 'init').mockRejectedValue(new Error('DB unavailable'))

    const items = [{ id: '1', stickerId: 's1', unlockedAt: '2026-01-01', synced: false }]
    await jubeeDB.putBulk('stickers', items)

    // Verify localStorage fallback worked
    // The key is `${DB_NAME}_${storeName}` -> 'jubee-love-db_stickers'
    const stored = localStorage.getItem('jubee-love-db_stickers')
    expect(stored).toBeTruthy()
    if (stored) {
        expect(stored).toContain('s1')
        const parsed = JSON.parse(stored)
        expect(parsed).toHaveLength(1)
        expect(parsed[0].id).toBe('1')
    }
  })
})
