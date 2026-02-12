import { describe, it, expect, beforeEach, vi } from 'vitest'
import { jubeeDB } from './indexedDB'

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

global.localStorage = localStorageMock as any

describe('IndexedDBService - putBulk Fallback', () => {
  beforeEach(() => {
    localStorageMock.clear()
    // Ensure indexedDB is undefined or throws to trigger fallback
    // In this environment, indexedDB is likely undefined, which `init()` checks.
    // However, `init()` throws if not supported.
    // Let's see how `init` is implemented:
    // if (!this.isSupported) throw Error
    // And constructor checks `typeof indexedDB`.
  })

  it('putBulk falls back to localStorage when IndexedDB is unavailable', async () => {
    // jubeeDB is already instantiated. `isSupported` was set at construction time.
    // If we are in Bun, indexedDB is likely undefined.

    // We can spy on console.error to avoid noise
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Attempt putBulk
    const items = [
      { id: '1', val: 'a', synced: false },
      { id: '2', val: 'b', synced: false }
    ] as any

    await jubeeDB.putBulk('gameProgress', items)

    // Verify localStorage has items
    const stored = JSON.parse(localStorageMock.getItem('jubee-love-db_gameProgress') || '[]')
    expect(stored).toHaveLength(2)
    expect(stored[0]).toMatchObject({ id: '1', val: 'a' })
    expect(stored[1]).toMatchObject({ id: '2', val: 'b' })

    errorSpy.mockRestore()
  })
})
