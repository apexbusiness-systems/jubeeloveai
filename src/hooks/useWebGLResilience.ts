/**
 * WebGL Resilience Hook
 * 
 * Handles WebGL context validation, loss prevention, and recovery.
 * Prevents catastrophic failures by monitoring context health and providing fallbacks.
 */

import { useEffect, useRef, useCallback } from 'react'

interface WebGLContextInfo {
  isValid: boolean
  lossCount: number
  lastLossTimestamp: number
  recoveryAttempts: number
  contextAge: number
}

const CONTEXT_CHECK_INTERVAL = 3000 // Check context every 3 seconds
const MAX_RECOVERY_ATTEMPTS = 3
const CONTEXT_RECREATION_DELAY = 500 // Wait before recreating context

export function useWebGLResilience(
  containerRef: React.RefObject<HTMLDivElement>,
  onContextLoss?: () => void,
  onContextRestore?: () => void
) {
  const contextInfoRef = useRef<WebGLContextInfo>({
    isValid: true,
    lossCount: 0,
    lastLossTimestamp: 0,
    recoveryAttempts: 0,
    contextAge: Date.now()
  })
  const recoveryTimeoutRef = useRef<NodeJS.Timeout>()

  // Validate WebGL context health
  const validateContext = useCallback((): boolean => {
    if (!containerRef.current) return false

    const canvas = containerRef.current.querySelector('canvas')
    if (!canvas) {
      console.warn('[WebGL Resilience] No canvas found')
      return false
    }

    try {
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null
      
      if (!gl) {
        console.warn('[WebGL Resilience] No WebGL context available')
        contextInfoRef.current.isValid = false
        return false
      }

      // Check if context is lost
      const isContextLost = gl.isContextLost()
      
      if (isContextLost) {
        console.error('[WebGL Resilience] Context is lost')
        contextInfoRef.current.isValid = false
        return false
      }

      // Perform basic rendering test to verify context is functional
      try {
        gl.getParameter(gl.VERSION)
        gl.getParameter(gl.RENDERER)
        contextInfoRef.current.isValid = true
        return true
      } catch (error) {
        console.error('[WebGL Resilience] Context test failed:', error)
        contextInfoRef.current.isValid = false
        return false
      }
    } catch (error) {
      console.error('[WebGL Resilience] Context validation error:', error)
      contextInfoRef.current.isValid = false
      return false
    }
  }, [containerRef])

  // Handle context loss event
  const handleContextLost = useCallback((event: Event) => {
    event.preventDefault()
    
    contextInfoRef.current.lossCount++
    contextInfoRef.current.lastLossTimestamp = Date.now()
    contextInfoRef.current.isValid = false

    console.error('[WebGL Resilience] Context lost event', {
      lossCount: contextInfoRef.current.lossCount,
      contextAge: Date.now() - contextInfoRef.current.contextAge
    })

    onContextLoss?.()
  }, [onContextLoss])

  // Handle context restore event
  const handleContextRestored = useCallback((_event: Event) => {
    console.log('[WebGL Resilience] Context restored event')
    
    contextInfoRef.current.isValid = true
    contextInfoRef.current.recoveryAttempts = 0
    contextInfoRef.current.contextAge = Date.now()

    onContextRestore?.()
  }, [onContextRestore])

  // Attempt to recover from context loss
  const attemptRecovery = useCallback(() => {
    if (contextInfoRef.current.recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
      console.error('[WebGL Resilience] Max recovery attempts reached')
      return
    }

    contextInfoRef.current.recoveryAttempts++
    
    console.log('[WebGL Resilience] Attempting recovery', contextInfoRef.current.recoveryAttempts)

    if (!containerRef.current) return

    const canvas = containerRef.current.querySelector('canvas')
    if (!canvas) return

    try {
      const gl = canvas.getContext('webgl')
      if (gl) {
        const ext = gl.getExtension('WEBGL_lose_context')
        if (ext) {
          // Attempt to restore context
          recoveryTimeoutRef.current = setTimeout(() => {
            try {
              ext.restoreContext()
              console.log('[WebGL Resilience] Context restore triggered')
            } catch (error) {
              console.error('[WebGL Resilience] Failed to restore context:', error)
            }
          }, CONTEXT_RECREATION_DELAY)
        }
      }
    } catch (error) {
      console.error('[WebGL Resilience] Recovery attempt failed:', error)
    }
  }, [containerRef])

  // Periodic context health checks
  useEffect(() => {
    const intervalId = setInterval(() => {
      const isValid = validateContext()
      
      if (!isValid && contextInfoRef.current.recoveryAttempts < MAX_RECOVERY_ATTEMPTS) {
        console.warn('[WebGL Resilience] Invalid context detected, attempting recovery')
        attemptRecovery()
      }

      // Log context health metrics
      const contextAge = Date.now() - contextInfoRef.current.contextAge
      if (contextAge > 300000 && contextInfoRef.current.lossCount > 0) { // 5 minutes
        console.warn('[WebGL Resilience] Context showing signs of instability:', {
          age: contextAge,
          lossCount: contextInfoRef.current.lossCount
        })
      }
    }, CONTEXT_CHECK_INTERVAL)

    return () => clearInterval(intervalId)
  }, [validateContext, attemptRecovery])

  // Attach WebGL context loss/restore event listeners
  useEffect(() => {
    if (!containerRef.current) return

    const canvas = containerRef.current.querySelector('canvas')
    if (!canvas) return

    canvas.addEventListener('webglcontextlost', handleContextLost)
    canvas.addEventListener('webglcontextrestored', handleContextRestored)

    console.log('[WebGL Resilience] Event listeners attached')

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost)
      canvas.removeEventListener('webglcontextrestored', handleContextRestored)
      
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current)
      }
    }
  }, [containerRef, handleContextLost, handleContextRestored])

  // Initial context validation
  useEffect(() => {
    setTimeout(() => {
      const isValid = validateContext()
      if (!isValid) {
        console.warn('[WebGL Resilience] Initial context validation failed')
      }
    }, 1000)
  }, [validateContext])

  return {
    isContextValid: contextInfoRef.current.isValid,
    contextInfo: contextInfoRef.current,
    validateContext,
    attemptRecovery
  }
}
