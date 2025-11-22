/**
 * Jubee Lifecycle Diagnostics Hook
 * 
 * Comprehensive diagnostic instrumentation for tracking Jubee's complete lifecycle
 * from store state changes through DOM rendering to WebGL context creation.
 * 
 * This hook is designed for Phase 1 Root Cause Investigation per systematic-debugging skill.
 */

import { useEffect, useRef } from 'react'
import { useJubeeStore } from '@/store/useJubeeStore'

interface LifecycleSnapshot {
  timestamp: number
  event: string
  state: {
    isVisible: boolean
    containerPosition: { bottom: number; right: number }
    position: { x: number; y: number; z: number }
    currentAnimation: string
    isDragging: boolean
  }
  dom: {
    containerExists: boolean
    canvasExists: boolean
    containerRect?: DOMRect
    containerStyles?: {
      display: string
      visibility: string
      opacity: string
      bottom: string
      right: string
    }
  }
  viewport: {
    width: number
    height: number
  }
}

const lifecycleHistory: LifecycleSnapshot[] = []
const MAX_HISTORY = 50

function captureSnapshot(event: string, containerRef: React.RefObject<HTMLDivElement>): LifecycleSnapshot {
  const store = useJubeeStore.getState()
  const container = containerRef.current
  
  const snapshot: LifecycleSnapshot = {
    timestamp: Date.now(),
    event,
    state: {
      isVisible: store.isVisible,
      containerPosition: { ...store.containerPosition },
      position: { ...store.position },
      currentAnimation: store.currentAnimation,
      isDragging: store.isDragging
    },
    dom: {
      containerExists: !!container,
      canvasExists: !!container?.querySelector('canvas'),
      containerRect: container?.getBoundingClientRect(),
      containerStyles: container ? {
        display: window.getComputedStyle(container).display,
        visibility: window.getComputedStyle(container).visibility,
        opacity: window.getComputedStyle(container).opacity,
        bottom: window.getComputedStyle(container).bottom,
        right: window.getComputedStyle(container).right
      } : undefined
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  }
  
  lifecycleHistory.push(snapshot)
  if (lifecycleHistory.length > MAX_HISTORY) {
    lifecycleHistory.shift()
  }
  
  return snapshot
}

export function useJubeeLifecycleDiagnostics(containerRef: React.RefObject<HTMLDivElement>) {
  const prevStateRef = useRef<ReturnType<typeof useJubeeStore.getState> | null>(null)
  const { isVisible, containerPosition, position, currentAnimation, isDragging } = useJubeeStore()
  
  // Track all state changes
  useEffect(() => {
    const snapshot = captureSnapshot('STATE_CHANGE', containerRef)
    const prevState = prevStateRef.current
    
    if (prevState) {
      const changes: string[] = []
      
      if (prevState.isVisible !== isVisible) {
        changes.push(`isVisible: ${prevState.isVisible} → ${isVisible}`)
      }
      if (prevState.containerPosition.bottom !== containerPosition.bottom || 
          prevState.containerPosition.right !== containerPosition.right) {
        changes.push(`containerPosition: {${prevState.containerPosition.bottom},${prevState.containerPosition.right}} → {${containerPosition.bottom},${containerPosition.right}}`)
      }
      if (prevState.currentAnimation !== currentAnimation) {
        changes.push(`animation: ${prevState.currentAnimation} → ${currentAnimation}`)
      }
      if (prevState.isDragging !== isDragging) {
        changes.push(`isDragging: ${prevState.isDragging} → ${isDragging}`)
      }
      
      if (changes.length > 0) {
        console.group('[🔍 DIAGNOSTIC] State Change Detected')
        console.log('Changes:', changes.join(', '))
        console.log('Snapshot:', snapshot)
        console.groupEnd()
      }
    }
    
    prevStateRef.current = useJubeeStore.getState()
  }, [isVisible, containerPosition, position, currentAnimation, isDragging, containerRef])
  
  // Track DOM mutations
  useEffect(() => {
    if (!containerRef.current) return
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          const snapshot = captureSnapshot('DOM_MUTATION', containerRef)
          console.log('[🔍 DIAGNOSTIC] DOM Mutation:', {
            type: mutation.type,
            target: mutation.target,
            snapshot
          })
        }
      })
    })
    
    observer.observe(containerRef.current, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['style', 'class']
    })
    
    return () => observer.disconnect()
  }, [containerRef])
  
  // Track visibility in viewport
  useEffect(() => {
    if (!containerRef.current) return
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const snapshot = captureSnapshot('INTERSECTION_CHANGE', containerRef)
        console.log('[🔍 DIAGNOSTIC] Intersection Change:', {
          isIntersecting: entry.isIntersecting,
          intersectionRatio: entry.intersectionRatio,
          boundingClientRect: entry.boundingClientRect,
          snapshot
        })
      })
    }, {
      threshold: [0, 0.25, 0.5, 0.75, 1.0]
    })
    
    observer.observe(containerRef.current)
    
    return () => observer.disconnect()
  }, [containerRef])
  
  // Periodic health check
  useEffect(() => {
    const interval = setInterval(() => {
      const snapshot = captureSnapshot('HEALTH_CHECK', containerRef)
      
      // Detect problematic states
      const issues: string[] = []
      
      if (snapshot.state.isVisible && !snapshot.dom.containerExists) {
        issues.push('CRITICAL: isVisible true but container does not exist in DOM')
      }
      
      if (snapshot.dom.containerExists && snapshot.dom.containerStyles?.display === 'none') {
        issues.push('WARNING: Container exists but display is none')
      }
      
      if (snapshot.dom.containerExists && snapshot.dom.containerStyles?.visibility === 'hidden') {
        issues.push('WARNING: Container exists but visibility is hidden')
      }
      
      if (snapshot.dom.containerExists && snapshot.dom.containerStyles?.opacity === '0') {
        issues.push('WARNING: Container exists but opacity is 0')
      }
      
      if (snapshot.state.isVisible && snapshot.dom.containerExists && !snapshot.dom.canvasExists) {
        issues.push('CRITICAL: isVisible true, container exists, but Canvas element missing')
      }
      
      const rect = snapshot.dom.containerRect
      if (rect && (rect.bottom < 0 || rect.top > snapshot.viewport.height || rect.right < 0 || rect.left > snapshot.viewport.width)) {
        issues.push('WARNING: Container positioned outside viewport bounds')
      }
      
      if (issues.length > 0) {
        console.group('[🔍 DIAGNOSTIC] Health Check - Issues Detected')
        issues.forEach(issue => console.error(issue))
        console.log('Snapshot:', snapshot)
        console.groupEnd()
      }
    }, 5000) // Check every 5 seconds
    
    return () => clearInterval(interval)
  }, [containerRef])
  
  // Expose diagnostic utilities
  return {
    getHistory: () => lifecycleHistory,
    captureSnapshot: () => captureSnapshot('MANUAL', containerRef),
    printHistory: () => {
      console.group('[🔍 DIAGNOSTIC] Lifecycle History')
      console.table(lifecycleHistory.map(s => ({
        time: new Date(s.timestamp).toLocaleTimeString(),
        event: s.event,
        isVisible: s.state.isVisible,
        containerExists: s.dom.containerExists,
        canvasExists: s.dom.canvasExists,
        bottomPx: s.state.containerPosition.bottom,
        rightPx: s.state.containerPosition.right
      })))
      console.groupEnd()
    }
  }
}

// Global diagnostic utilities
if (typeof window !== 'undefined') {
  (window as any).jubeeDebug = {
    getHistory: () => lifecycleHistory,
    printHistory: () => {
      console.group('[🔍 DIAGNOSTIC] Lifecycle History')
      console.table(lifecycleHistory.map(s => ({
        time: new Date(s.timestamp).toLocaleTimeString(),
        event: s.event,
        isVisible: s.state.isVisible,
        containerExists: s.dom.containerExists,
        canvasExists: s.dom.canvasExists,
        bottomPx: s.state.containerPosition.bottom,
        rightPx: s.state.containerPosition.right
      })))
      console.groupEnd()
    },
    printLatest: () => {
      const latest = lifecycleHistory[lifecycleHistory.length - 1]
      console.group('[🔍 DIAGNOSTIC] Latest Snapshot')
      console.log(latest)
      console.groupEnd()
    }
  }
}
