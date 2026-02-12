import { describe, it, expect, beforeEach, vi } from 'vitest'
import { jubeeDB } from './indexedDB'

// Unmock to test real implementation
vi.unmock('@/lib/indexedDB')

describe('IndexedDBService.putBulk', () => {
  beforeEach(async () => {
    // Ensure DB is initialized and clear store
    try {
        await jubeeDB.clear('drawings')
    } catch (e) {
        // Ignore if DB not open or store empty
    }
  })

  it('should insert multiple records in single transaction', async () => {
    const items = [
      { id: '1', imageData: 'data1', createdAt: '2026-01-01', updatedAt: '2026-01-01', synced: false },
      { id: '2', imageData: 'data2', createdAt: '2026-01-02', updatedAt: '2026-01-02', synced: false }
    ]

    await jubeeDB.putBulk('drawings', items)

    const result1 = await jubeeDB.get('drawings', '1')
    const result2 = await jubeeDB.get('drawings', '2')

    expect(result1).toBeDefined()
    expect(result2).toBeDefined()
    expect(result1?.imageData).toBe('data1')
    expect(result2?.imageData).toBe('data2')
  })

  it('should handle empty array gracefully', async () => {
    await expect(jubeeDB.putBulk('drawings', [])).resolves.not.toThrow()
  })

  it('should update existing records in bulk', async () => {
    // Insert initial
    await jubeeDB.put('drawings', {
      id: '1', imageData: 'data',
      createdAt: '2026-01-01', updatedAt: '2026-01-01', synced: false
    })

    // Bulk update
    await jubeeDB.putBulk('drawings', [{
      id: '1', imageData: 'data',
      createdAt: '2026-01-01', updatedAt: '2026-01-02', synced: true
    }])

    const result = await jubeeDB.get('drawings', '1')
    expect(result?.updatedAt).toBe('2026-01-02')
    expect(result?.synced).toBe(true)
  })
})
