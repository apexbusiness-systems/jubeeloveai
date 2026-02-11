import { describe, it, expect, vi } from 'vitest'

// Mock dependencies
const mockSaveToLocalStore = vi.fn().mockImplementation(async () => {
  await new Promise(resolve => setTimeout(resolve, 10)) // Simulate 10ms I/O
})

const mockSyncToServer = vi.fn().mockImplementation(async () => {
  await new Promise(resolve => setTimeout(resolve, 10)) // Simulate 10ms network
})

interface MockConflict {
  id: string
  storeName: string
}

// Simulate the original (buggy/serial) implementation
async function runSerialResolution(conflicts: MockConflict[], diagnosis: Record<string, string>) {
  // Simulate resolution phase (instant for this test as we focus on IO)
  const resolvedDataArray = conflicts.map(c => ({ id: c.id, value: 'resolved' }))

  // Simulate the loop from handleAutoDiagnose
  for (let i = 0; i < resolvedDataArray.length; i++) {
    const data = resolvedDataArray[i]
    const conflict = conflicts[i]

    if (conflict) {
      await mockSaveToLocalStore(conflict.storeName, data)

      if (diagnosis[conflict.id] === 'local' || diagnosis[conflict.id] === 'merge') {
        await mockSyncToServer(conflict.storeName, data, 'user-id')
      }
    }
  }
}

// Simulate the optimized (parallel) implementation
async function runParallelResolution(conflicts: MockConflict[], diagnosis: Record<string, string>) {
  // Simulate resolution phase
  const resolvedDataArray = conflicts.map(c => ({ id: c.id, value: 'resolved' }))

  // Optimized parallel execution
  const promises = resolvedDataArray.map((data, i) => {
    const conflict = conflicts[i]
    if (!conflict) return Promise.resolve()

    const tasks = [mockSaveToLocalStore(conflict.storeName, data)]

    if (diagnosis[conflict.id] === 'local' || diagnosis[conflict.id] === 'merge') {
      tasks.push(mockSyncToServer(conflict.storeName, data, 'user-id'))
    }

    return Promise.all(tasks)
  })

  await Promise.all(promises)
}

describe('Conflict Resolution Performance', () => {
  const conflicts: MockConflict[] = Array.from({ length: 10 }, (_, i) => ({
    id: `conflict-${i}`,
    storeName: 'gameProgress'
  }))

  const diagnosis: Record<string, string> = {}
  conflicts.forEach(c => {
    diagnosis[c.id] = 'local' // Ensure syncToServer is called
  })

  it('serial execution should take longer than parallel', async () => {
    const startSerial = performance.now()
    await runSerialResolution(conflicts, diagnosis)
    const endSerial = performance.now()
    const serialTime = endSerial - startSerial

    const startParallel = performance.now()
    await runParallelResolution(conflicts, diagnosis)
    const endParallel = performance.now()
    const parallelTime = endParallel - startParallel

    console.log(`Serial: ${serialTime.toFixed(2)}ms`)
    console.log(`Parallel: ${parallelTime.toFixed(2)}ms`)

    // Parallel should be significantly faster
    // Serial: 10 items * (10ms save + 10ms sync) = 200ms
    // Parallel: max(10ms save, 10ms sync) = 10ms (roughly)
    expect(parallelTime).toBeLessThan(serialTime)
    expect(serialTime).toBeGreaterThan(100) // At least 100ms
    expect(parallelTime).toBeLessThan(100) // Should be much less, ideally close to 10-20ms overhead
  })
})
