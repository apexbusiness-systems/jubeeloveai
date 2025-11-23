import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useJubeeStore } from '../useJubeeStore'

describe('useJubeeStore', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useJubeeStore())
    
    expect(result.current.position).toEqual({ x: 0, y: 0, z: 0 })
    expect(result.current.isVisible).toBe(true)
    expect(result.current.currentAnimation).toBe('idle')
    expect(result.current.gender).toBe('female')
    expect(result.current.voice).toBe('shimmer')
  })

  it('should update Jubee position', () => {
    const { result } = renderHook(() => useJubeeStore())
    
    act(() => {
      result.current.updatePosition({ x: 1, y: 2, z: 0 })
    })

    expect(result.current.position.x).toBeCloseTo(1)
    expect(result.current.position.y).toBeCloseTo(2)
  })

  it('should update container position', () => {
    const { result } = renderHook(() => useJubeeStore())
    
    act(() => {
      result.current.setContainerPosition({ bottom: 100, right: 50 })
    })

    expect(result.current.containerPosition).toEqual({ bottom: 100, right: 50 })
  })

  it('should trigger animation', () => {
    const { result } = renderHook(() => useJubeeStore())
    
    act(() => {
      result.current.triggerAnimation('wave')
    })

    expect(result.current.currentAnimation).toBe('wave')
  })

  it('should toggle visibility', () => {
    const { result } = renderHook(() => useJubeeStore())
    
    expect(result.current.isVisible).toBe(true)
    
    act(() => {
      result.current.toggleVisibility()
    })

    expect(result.current.isVisible).toBe(false)

    act(() => {
      result.current.toggleVisibility()
    })

    expect(result.current.isVisible).toBe(true)
  })

  it('should set gender', () => {
    const { result } = renderHook(() => useJubeeStore())
    
    act(() => {
      result.current.setGender('male')
    })

    expect(result.current.gender).toBe('male')
  })

  it('should set voice', () => {
    const { result } = renderHook(() => useJubeeStore())
    
    act(() => {
      result.current.setVoice('nova')
    })

    expect(result.current.voice).toBe('nova')
  })

  it('should handle dragging state', () => {
    const { result } = renderHook(() => useJubeeStore())
    
    act(() => {
      result.current.setIsDragging(true)
    })

    expect(result.current.isDragging).toBe(true)

    act(() => {
      result.current.setIsDragging(false)
    })

    expect(result.current.isDragging).toBe(false)
  })
})
