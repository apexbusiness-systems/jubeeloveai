import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'fake-indexeddb/auto'

// Unmock the module so we test the real implementation
vi.unmock('@/lib/indexedDB')
// Also unmock the relative path just in case
vi.unmock('../indexedDB')

import { jubeeDB } from '../indexedDB'

describe('IndexedDBService.putBulk', () => {
  beforeEach(async () => {
    // indexedDB is mocked by jsdom in vitest, but we might need to reset it
    // However, jubeeDB uses a singleton.
    // Let's clear the store we are testing.
    await jubeeDB.init()
    await jubeeDB.clear('stickers')
  })

  it('should insert multiple records in single transaction', async () => {
    const items = [
      { id: '1', stickerId: 'star', unlockedAt: '2026-01-01', synced: false },
      { id: '2', stickerId: 'heart', unlockedAt: '2026-01-02', synced: false }
    ]

    await jubeeDB.putBulk('stickers', items)

    const result1 = await jubeeDB.get('stickers', '1')
    const result2 = await jubeeDB.get('stickers', '2')

    expect(result1).toBeDefined()
    expect(result2).toBeDefined()
    expect(result1?.stickerId).toBe('star')
    expect(result2?.stickerId).toBe('heart')
  })

  it('should handle empty array gracefully', async () => {
    await expect(jubeeDB.putBulk('stickers', [])).resolves.not.toThrow()
  })

  it('should update existing records in bulk', async () => {
    // Insert initial
    await jubeeDB.put('stickers', {
      id: '1', stickerId: 'star', unlockedAt: '2026-01-01', synced: false
    })

    // Bulk update
    await jubeeDB.putBulk('stickers', [{
      id: '1', stickerId: 'star', unlockedAt: '2026-01-01', synced: true
    }])

    const result = await jubeeDB.get('stickers', '1')
    expect(result?.synced).toBe(true)
  })
})
