import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Unmock the module that is globally mocked in setup.ts
vi.unmock('./indexedDB')

import { IndexedDBService } from './indexedDB'

// Mock IndexedDB structures
const mockPut = vi.fn()
const mockTransaction = {
  objectStore: vi.fn(() => ({
    put: mockPut,
  })),
  oncomplete: null as (() => void) | null,
  onerror: null as (() => void) | null,
}

const mockDb = {
  transaction: vi.fn(() => mockTransaction),
  objectStoreNames: { contains: vi.fn().mockReturnValue(true) },
  createObjectStore: vi.fn(),
}

const mockOpenRequest = {
  onerror: null as (() => void) | null,
  onsuccess: null as (() => void) | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onupgradeneeded: null as ((e: any) => void) | null,
  result: mockDb,
}

const mockIndexedDB = {
  open: vi.fn(() => mockOpenRequest),
}

describe('IndexedDBService', () => {
  let dbService: IndexedDBService;
  const originalIndexedDB = window.indexedDB;

  beforeEach(() => {
    // Manually stub window.indexedDB
    Object.defineProperty(window, 'indexedDB', {
      value: mockIndexedDB,
      writable: true
    });

    dbService = new IndexedDBService();

    vi.clearAllMocks()

    // Reset mock properties
    mockOpenRequest.onsuccess = null
    mockOpenRequest.onerror = null
    mockTransaction.oncomplete = null
  })

  afterEach(() => {
    // Restore window.indexedDB
    Object.defineProperty(window, 'indexedDB', {
      value: originalIndexedDB,
      writable: true
    });
  })

  it('putBulk should use a single transaction for multiple items', async () => {
    const items = [
      { id: '1', score: 100, synced: false },
      { id: '2', score: 200, synced: false }
    ]

    // Start the operation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promise = dbService.putBulk('gameProgress', items as any)

    // Simulate DB open success
    await new Promise(resolve => setTimeout(resolve, 0))
    if (mockOpenRequest.onsuccess) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockOpenRequest.onsuccess as any)({ target: mockOpenRequest })
    }

    // Verify puts happened
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(mockIndexedDB.open).toHaveBeenCalled()
    expect(mockDb.transaction).toHaveBeenCalledWith(['gameProgress'], 'readwrite')
    expect(mockTransaction.objectStore).toHaveBeenCalledWith('gameProgress')
    expect(mockPut).toHaveBeenCalledTimes(2)
    expect(mockPut).toHaveBeenCalledWith(items[0])
    expect(mockPut).toHaveBeenCalledWith(items[1])

    // Complete transaction
    if (mockTransaction.oncomplete) {
      mockTransaction.oncomplete()
    }

    await promise
  })
})
