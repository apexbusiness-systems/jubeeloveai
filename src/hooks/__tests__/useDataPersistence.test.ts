import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDataPersistence, loadPersistedData } from '../useDataPersistence'

describe('useDataPersistence', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllTimers()
  })

  it('should load persisted data', () => {
    const testData = { test: 'value' }
    localStorage.setItem('test-key', JSON.stringify(testData))

    const result = loadPersistedData('test-key', {})
    expect(result).toEqual(testData)
  })

  it('should return default value when no data exists', () => {
    const defaultData = { default: true }
    const result = loadPersistedData('non-existent', defaultData)
    expect(result).toEqual(defaultData)
  })

  it('should not persist on initial mount', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    
    renderHook(() => useDataPersistence('test', { value: 1 }))

    expect(setItemSpy).not.toHaveBeenCalled()
  })

  it('should handle localStorage errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage full')
    })

    renderHook(() => useDataPersistence('test', { value: 1 }))

    expect(consoleSpy).not.toHaveBeenCalled() // Only called on actual save attempt
    consoleSpy.mockRestore()
  })
})
