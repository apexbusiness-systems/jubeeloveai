import { describe, it, expect, beforeEach } from 'vitest'

// Mock localStorage globally before importing the module
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

// Import after setting up globals
import { conflictResolver, ConflictGroup, ResolvedConflict } from './conflictResolver'

describe('ConflictResolver', () => {
  beforeEach(() => {
    conflictResolver.clearAll()
  })

  it('resolveBatch returns mapped data with IDs', async () => {
    // Setup conflicts
    const conflict1: ConflictGroup = {
      id: 'c1',
      storeName: 'store1',
      recordId: 'r1',
      conflicts: [],
      localData: { val: 'local1' },
      serverData: { val: 'server1' },
      createdAt: new Date()
    }
    const conflict2: ConflictGroup = {
      id: 'c2',
      storeName: 'store2',
      recordId: 'r2',
      conflicts: [],
      localData: { val: 'local2' },
      serverData: { val: 'server2' },
      createdAt: new Date()
    }

    conflictResolver.addConflict(conflict1)
    conflictResolver.addConflict(conflict2)

    // Resolve batch
    const results = await conflictResolver.resolveBatch(['c1', 'c2'], 'local')

    expect(results).toHaveLength(2)

    // Check if results have ID and data property (Required for fix)
    expect(results[0]).toHaveProperty('id')
    expect(results[0]).toHaveProperty('data')

    // Verify mapping
    const r1 = results.find((r: ResolvedConflict) => r.id === 'c1')
    expect(r1).toBeDefined()
    expect(r1?.data).toEqual({ val: 'local1', synced: true })

    const r2 = results.find((r: ResolvedConflict) => r.id === 'c2')
    expect(r2).toBeDefined()
    expect(r2?.data).toEqual({ val: 'local2', synced: true })
  })

  it('resolveAll returns mapped data with IDs', async () => {
    const conflict1: ConflictGroup = {
      id: 'c1',
      storeName: 'store1',
      recordId: 'r1',
      conflicts: [],
      localData: { val: 'local1' },
      serverData: { val: 'server1' },
      createdAt: new Date()
    }
    conflictResolver.addConflict(conflict1)

    const results = await conflictResolver.resolveAll('server')

    expect(results).toHaveLength(1)
    expect(results[0]).toHaveProperty('id')
    expect(results[0].id).toBe('c1')
    expect(results[0].data).toEqual({ val: 'server1', synced: true })
  })

  it('resolveByStore returns mapped data with IDs', async () => {
    const conflict1: ConflictGroup = {
      id: 'c1',
      storeName: 'store1',
      recordId: 'r1',
      conflicts: [],
      localData: { val: 'local1' },
      serverData: { val: 'server1' },
      createdAt: new Date()
    }
    const conflict2: ConflictGroup = {
      id: 'c2',
      storeName: 'store2',
      recordId: 'r2',
      conflicts: [],
      localData: { val: 'local2' },
      serverData: { val: 'server2' },
      createdAt: new Date()
    }
    conflictResolver.addConflict(conflict1)
    conflictResolver.addConflict(conflict2)

    const results = await conflictResolver.resolveByStore('store1', 'local')

    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('c1')
    expect(results[0].data).toEqual({ val: 'local1', synced: true })
  })
})
