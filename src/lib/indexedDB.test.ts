import { describe, it, expect, beforeEach, vi } from 'vitest'
import { jubeeDB, DBSchema } from './indexedDB'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    clear: () => {
      store = {}
    },
    removeItem: (key: string) => {
      delete store[key]
    }
  }
})()

global.localStorage = localStorageMock as Storage

describe('IndexedDBService - putBulk Fallback', () => {
  beforeEach(() => {
    localStorageMock.clear()
    // Ensure indexedDB is undefined or throws to trigger fallback
  })

  it('putBulk falls back to localStorage when IndexedDB is unavailable', async () => {
    // We can spy on console.error to avoid noise
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Attempt putBulk
    const items: DBSchema['gameProgress']['value'][] = [
      {
        id: '1',
        score: 100,
        activitiesCompleted: 1,
        currentTheme: 'theme1',
        updatedAt: '2024-01-01',
        synced: false
      },
      {
        id: '2',
        score: 200,
        activitiesCompleted: 2,
        currentTheme: 'theme2',
        updatedAt: '2024-01-02',
        synced: false
      }
    ]

    await jubeeDB.putBulk('gameProgress', items)

    // Verify localStorage has items
    const stored = JSON.parse(localStorageMock.getItem('jubee-love-db_gameProgress') || '[]')
    expect(stored).toHaveLength(2)
    expect(stored[0]).toMatchObject({ id: '1', score: 100 })
    expect(stored[1]).toMatchObject({ id: '2', score: 200 })

    errorSpy.mockRestore()
  })
})
