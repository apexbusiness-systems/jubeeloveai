import { describe, it, expect, beforeEach, vi } from 'vitest'

// Unmock the module we are testing because it is globally mocked in setup.ts
vi.unmock('../indexedDB')
vi.unmock('@/lib/indexedDB')

import { jubeeDB } from '../indexedDB'

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }
}))

describe('IndexedDB Service - putBulk', () => {
  it('should insert multiple records in single transaction', async () => {
    const items = [
      { id: 'bulk-1', stickerId: 's1', unlockedAt: '2026-01-01', synced: false },
      { id: 'bulk-2', stickerId: 's2', unlockedAt: '2026-01-02', synced: false }
    ]

    // We assume the DB handles initialization internally
    await jubeeDB.putBulk('stickers', items)

    const result1 = await jubeeDB.get('stickers', 'bulk-1')
    const result2 = await jubeeDB.get('stickers', 'bulk-2')

    expect(result1).toBeDefined()
    expect(result1?.stickerId).toBe('s1')
    expect(result2).toBeDefined()
    expect(result2?.stickerId).toBe('s2')
  })

  it('should handle empty array', async () => {
    await jubeeDB.putBulk('stickers', [])
    // Should just resolve without error
    expect(true).toBe(true)
  })

  it('should fallback to localStorage on IndexedDB failure (init error)', async () => {
    // Mock jubeeDB.init to throw error
    const initSpy = vi.spyOn(jubeeDB, 'init').mockRejectedValue(new Error('Simulated DB Failure'))
    const localStorageSpy = vi.spyOn(Storage.prototype, 'setItem')

    const items = [
      { id: 'fallback-1', stickerId: 's3', unlockedAt: '2026-01-03', synced: false }
    ]

    await jubeeDB.putBulk('stickers', items)

    // Check if localStorage was used
    expect(localStorageSpy).toHaveBeenCalled()
    // Verify item is in localStorage
    const stored = JSON.parse(localStorage.getItem('jubee-love-db_stickers') || '[]')
    const item = stored.find((i: { id: string, stickerId: string }) => i.id === 'fallback-1')
    expect(item).toBeDefined()
    expect(item?.stickerId).toBe('s3')

    // Cleanup
    initSpy.mockRestore()
    localStorageSpy.mockRestore()
  })

  it('should fallback to localStorage on async transaction error', async () => {
    // Mock init to return a db object where transaction fails asynchronously
    const mockTransaction = {
      objectStore: () => ({ put: () => {} }),
      oncomplete: null as unknown,
      onerror: null as unknown
    }

    const mockDb = {
      transaction: () => {
        // trigger error asynchronously
        setTimeout(() => {
          if (mockTransaction.onerror && typeof mockTransaction.onerror === 'function') (mockTransaction.onerror as unknown as () => void)()
        }, 10)
        return mockTransaction
      }
    }
    const initSpy = vi.spyOn(jubeeDB, 'init').mockResolvedValue(mockDb as unknown as IDBDatabase)
    const localStorageSpy = vi.spyOn(Storage.prototype, 'setItem')

    const items = [
      { id: 'async-fail-1', stickerId: 's5', unlockedAt: '2026-01-05', synced: false }
    ]

    await jubeeDB.putBulk('stickers', items)

    expect(localStorageSpy).toHaveBeenCalled()
    const stored = JSON.parse(localStorage.getItem('jubee-love-db_stickers') || '[]')
    expect(stored.find((i: { id: string }) => i.id === 'async-fail-1')).toBeDefined()

    initSpy.mockRestore()
    localStorageSpy.mockRestore()
  })
})
