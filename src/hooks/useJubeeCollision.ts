/**
 * Jubee Collision Detection Hook
 *
 * Detects overlaps between Jubee and UI elements (cards, buttons, header)
 * and automatically repositions Jubee to avoid overlapping.
 */

import { useEffect, useCallback, useRef } from 'react'
import { useJubeeStore } from '@/store/useJubeeStore'
import { validatePosition, getPreferredPositions, calculateDistance } from '@/core/jubee/JubeePositionManager'

interface CollisionRect {
  top: number
  left: number
  bottom: number
  right: number
  width: number
  height: number
}

const COLLISION_SELECTORS = [
  '.main-card',
  '.game-card',
  'header',
  'button:not(.jubee-toggle)',
  '.activity-card',
  '.achievement-card',
  'nav'
]

const COLLISION_PADDING = 20 // pixels

export function useJubeeCollision(containerRef: React.RefObject<HTMLDivElement>) {
  const { containerPosition, setContainerPosition } = useJubeeStore()
  const checkingRef = useRef(false)

  const getElementRect = useCallback((element: HTMLElement): CollisionRect => {
    const rect = element.getBoundingClientRect()
    return {
      top: rect.top,
      left: rect.left,
      bottom: rect.bottom,
      right: rect.right,
      width: rect.width,
      height: rect.height
    }
  }, [])

  const checkCollision = useCallback((rect1: CollisionRect, rect2: CollisionRect): boolean => {
    return !(
      rect1.right + COLLISION_PADDING < rect2.left ||
      rect1.left - COLLISION_PADDING > rect2.right ||
      rect1.bottom + COLLISION_PADDING < rect2.top ||
      rect1.top - COLLISION_PADDING > rect2.bottom
    )
  }, [])

  // Use centralized validation - removed local implementation

  const findSafePosition = useCallback((
    jubeeRect: CollisionRect,
    collidingElements: CollisionRect[]
  ): { bottom: number; right: number } | null => {
    // Get preferred positions from centralized manager
    const preferredPositions = getPreferredPositions()

    for (const position of preferredPositions) {
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      
      // Calculate new rect for this position (converting from bottom/right to top/left)
      const testRect: CollisionRect = {
        top: viewportHeight - position.bottom - 450,
        bottom: viewportHeight - position.bottom,
        left: viewportWidth - position.right - 400,
        right: viewportWidth - position.right,
        width: 400,
        height: 450
      }

      // Check if this position collides with any elements
      const hasCollision = collidingElements.some(element => 
        checkCollision(testRect, element)
      )

      if (!hasCollision) {
        // Found a safe position - already validated by getPreferredPositions
        return position
      }
    }

    // If no safe position found, pick the one farthest from all colliding elements
    let bestPosition = preferredPositions[0]
    let maxMinDistance = 0

    for (const position of preferredPositions) {
      // Find minimum distance to any colliding element using centralized distance calc
      const minDistance = Math.min(
        ...preferredPositions.map(p => calculateDistance(position, p))
      )

      if (minDistance > maxMinDistance) {
        maxMinDistance = minDistance
        bestPosition = position
      }
    }

    return bestPosition
  }, [checkCollision])

  const detectAndResolveCollisions = useCallback(() => {
    if (!containerRef.current || checkingRef.current) return

    checkingRef.current = true

    try {
      const jubeeRect = getElementRect(containerRef.current)
      const collidingElements: CollisionRect[] = []

      // Check all UI elements for collisions
      COLLISION_SELECTORS.forEach(selector => {
        const elements = document.querySelectorAll(selector)
        elements.forEach(element => {
          if (element instanceof HTMLElement && !element.closest('.jubee-container')) {
            const elementRect = getElementRect(element)
            if (checkCollision(jubeeRect, elementRect)) {
              collidingElements.push(elementRect)
            }
          }
        })
      })

      // If collisions detected, find and move to safe position
      if (collidingElements.length > 0) {
        console.group('[🔍 DIAGNOSTIC] Collision Detection')
        console.log('Collisions detected:', collidingElements.length)
        console.log('Jubee rect:', jubeeRect)
        console.log('Colliding elements:', collidingElements)
        
        const safePosition = findSafePosition(jubeeRect, collidingElements)
        
        if (safePosition) {
          console.log('Safe position found:', safePosition)
          console.log('Call stack:', new Error().stack?.split('\n').slice(1, 4).join('\n'))
          console.groupEnd()
          setContainerPosition(safePosition)
        } else {
          console.warn('No safe position found!')
          console.groupEnd()
        }
      }
    } finally {
      checkingRef.current = false
    }
  }, [containerRef, getElementRect, checkCollision, findSafePosition, setContainerPosition])

  // Optimized collision detection with debouncing - reduce frequency significantly
  useEffect(() => {
    // Only run collision detection on initial mount and after navigation
    const timeoutId1 = setTimeout(detectAndResolveCollisions, 200)
    const timeoutId2 = setTimeout(detectAndResolveCollisions, 1000)
    
    return () => {
      clearTimeout(timeoutId1)
      clearTimeout(timeoutId2)
    }
  }, [detectAndResolveCollisions])

  // Debounced resize handler
  useEffect(() => {
    let resizeTimeout: ReturnType<typeof setTimeout>
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(detectAndResolveCollisions, 300)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimeout)
    }
  }, [detectAndResolveCollisions])

  // Optimized mutation observer with heavy debouncing
  useEffect(() => {
    let mutationTimeout: ReturnType<typeof setTimeout>
    const observer = new MutationObserver(() => {
      clearTimeout(mutationTimeout)
      mutationTimeout = setTimeout(detectAndResolveCollisions, 500) // Increased debounce
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => {
      observer.disconnect()
      clearTimeout(mutationTimeout)
    }
  }, [detectAndResolveCollisions])

  // REMOVED: Continuous validation - was causing the feedback loop
  // Position validation now only happens during specific events

  return { detectAndResolveCollisions }
}
