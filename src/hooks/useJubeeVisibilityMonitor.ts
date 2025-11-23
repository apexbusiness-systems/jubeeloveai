/**
 * Jubee Visibility Monitor Hook
 *
 * Monitors whether Jubee is actually visible on screen and renders properly.
 * Provides failsafe recovery when Jubee disappears or fails to render.
 */

import { useEffect, useRef, useState } from 'react'
import { useJubeeStore } from '@/store/useJubeeStore'
import { validatePosition, getSafeDefaultPosition } from '@/core/jubee/JubeePositionManager'

interface VisibilityState {
  isActuallyVisible: boolean
  lastSeenTimestamp: number
  invisibleDuration: number
}

const VISIBILITY_CHECK_INTERVAL = 2000 // Check every 2 seconds
const INVISIBILITY_THRESHOLD = 5000 // Consider lost after 5 seconds
const RECOVERY_ATTEMPTS_MAX = 3

export function useJubeeVisibilityMonitor(containerRef: React.RefObject<HTMLDivElement>) {
  const { isVisible, containerPosition, setContainerPosition } = useJubeeStore()
  const [needsRecovery, setNeedsRecovery] = useState(false)
  const stateRef = useRef<VisibilityState>({
    isActuallyVisible: true,
    lastSeenTimestamp: Date.now(),
    invisibleDuration: 0
  })
  const recoveryAttemptsRef = useRef(0)

  const checkVisibility = () => {
    if (!containerRef.current || !isVisible) {
      stateRef.current.isActuallyVisible = false
      return false
    }

    try {
      const rect = containerRef.current.getBoundingClientRect()
      const canvas = containerRef.current.querySelector('canvas')
      
      // Check if container has valid dimensions
      const hasValidDimensions = rect.width > 0 && rect.height > 0
      
      // Check if within viewport
      const isInViewport = 
        rect.top < window.innerHeight &&
        rect.bottom > 0 &&
        rect.left < window.innerWidth &&
        rect.right > 0
      
      // Check if canvas exists - don't check context as it's managed by React Three Fiber
      const hasValidCanvas = !!canvas
      
      // Check opacity
      const computedStyle = window.getComputedStyle(containerRef.current)
      const isOpaque = parseFloat(computedStyle.opacity) > 0.1
      
      const actuallyVisible = hasValidDimensions && isInViewport && hasValidCanvas && isOpaque
      
      if (actuallyVisible) {
        stateRef.current.isActuallyVisible = true
        stateRef.current.lastSeenTimestamp = Date.now()
        stateRef.current.invisibleDuration = 0
        recoveryAttemptsRef.current = 0
        
        if (needsRecovery) {
          console.log('[Jubee Visibility] Successfully recovered!')
          setNeedsRecovery(false)
        }
      } else {
        stateRef.current.isActuallyVisible = false
        stateRef.current.invisibleDuration = Date.now() - stateRef.current.lastSeenTimestamp
        
        // Log why it's not visible
        console.warn('[Jubee Visibility] Not visible:', {
          hasValidDimensions,
          isInViewport,
          hasValidCanvas,
          isOpaque,
          rect: { 
            top: rect.top, 
            left: rect.left, 
            width: rect.width, 
            height: rect.height 
          }
        })
        
        // Trigger recovery if invisible for too long
        if (
          stateRef.current.invisibleDuration > INVISIBILITY_THRESHOLD &&
          recoveryAttemptsRef.current < RECOVERY_ATTEMPTS_MAX
        ) {
          console.error('[Jubee Visibility] Triggering recovery attempt', recoveryAttemptsRef.current + 1)
          attemptRecovery()
        }
      }
      
      return actuallyVisible
    } catch (error) {
      console.error('[Jubee Visibility] Check failed:', error)
      return false
    }
  }

  const attemptRecovery = () => {
    recoveryAttemptsRef.current++
    
    // Use centralized safe position calculation
    const safePosition = getSafeDefaultPosition()
    
    console.log('[Jubee Visibility] Attempting recovery - resetting to safe position:', safePosition)
    setContainerPosition(safePosition)
    
    // Force re-render by toggling visibility flag
    setTimeout(() => {
      if (!stateRef.current.isActuallyVisible) {
        console.log('[Jubee Visibility] Still not visible after recovery, showing manual reset UI')
        setNeedsRecovery(true)
      }
    }, 1000)
  }

  const forceReset = () => {
    console.log('[Jubee Visibility] Manual reset triggered')
    recoveryAttemptsRef.current = 0
    
    // Use centralized safe position calculation
    const safePosition = getSafeDefaultPosition()
    
    console.log('[Jubee Visibility] Resetting to safe position:', safePosition)
    setContainerPosition(safePosition)
    setNeedsRecovery(false)
    
    // Force reload of WebGL context by remounting
    if (containerRef.current) {
      const canvas = containerRef.current.querySelector('canvas')
      if (canvas) {
        // Trigger context restore
        const gl = canvas.getContext('webgl')
        if (gl) {
          const ext = gl.getExtension('WEBGL_lose_context')
          if (ext) {
            ext.restoreContext()
          }
        }
      }
    }
  }

  // Periodic visibility checks
  useEffect(() => {
    const intervalId = setInterval(() => {
      checkVisibility()
    }, VISIBILITY_CHECK_INTERVAL)

    // Initial check
    setTimeout(checkVisibility, 500)

    return () => clearInterval(intervalId)
  }, [isVisible, containerRef, checkVisibility])

  // Check on position changes
  useEffect(() => {
    setTimeout(checkVisibility, 300)
  }, [containerPosition, checkVisibility])

  return {
    needsRecovery,
    forceReset,
    checkVisibility
  }
}
