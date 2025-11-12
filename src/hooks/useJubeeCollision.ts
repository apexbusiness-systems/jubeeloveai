/**
 * Jubee Collision Detection Hook
 * 
 * Detects overlaps between Jubee and UI elements (cards, buttons, header)
 * and automatically repositions Jubee to avoid overlapping.
 */

import { useEffect, useCallback, useRef } from 'react'
import { useJubeeStore } from '@/store/useJubeeStore'

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
const REPOSITION_ANIMATION_DURATION = 300 // ms

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

  const validatePosition = useCallback((pos: { bottom: number; right: number }): { bottom: number; right: number } => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const jubeeWidth = 400
    const jubeeHeight = 450
    
    // Ensure Jubee is fully visible within viewport with generous margins
    const minBottom = 100
    const maxBottom = viewportHeight - jubeeHeight - 100
    const minRight = 80
    const maxRight = viewportWidth - jubeeWidth - 80
    
    return {
      bottom: Math.max(minBottom, Math.min(maxBottom, pos.bottom)),
      right: Math.max(minRight, Math.min(maxRight, pos.right))
    }
  }, [])

  const findSafePosition = useCallback((
    jubeeRect: CollisionRect,
    collidingElements: CollisionRect[]
  ): { bottom: number; right: number } | null => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Try positions in order of preference: bottom-right, bottom-left, top-right, top-left
    const positions = [
      { bottom: 150, right: 50 }, // Default safe position
      { bottom: 150, right: viewportWidth - jubeeRect.width - 50 },
      { bottom: viewportHeight - jubeeRect.height - 100, right: 50 },
      { bottom: viewportHeight - jubeeRect.height - 100, right: viewportWidth - jubeeRect.width - 50 },
      { bottom: viewportHeight / 2, right: 50 },
      { bottom: 150, right: viewportWidth / 2 - jubeeRect.width / 2 }
    ]

    for (const pos of positions) {
      // Validate position is within safe bounds first
      const validatedPos = validatePosition(pos)
      
      const testRect: CollisionRect = {
        top: viewportHeight - validatedPos.bottom - jubeeRect.height,
        left: viewportWidth - validatedPos.right - jubeeRect.width,
        bottom: viewportHeight - validatedPos.bottom,
        right: viewportWidth - validatedPos.right,
        width: jubeeRect.width,
        height: jubeeRect.height
      }

      const hasCollision = collidingElements.some(elementRect => 
        checkCollision(testRect, elementRect)
      )

      if (!hasCollision) {
        return validatedPos
      }
    }

    // If no collision-free position found, return validated default
    return validatePosition({ bottom: 150, right: 50 })
  }, [checkCollision, validatePosition])

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
        console.log('[Jubee Collision] Detected', collidingElements.length, 'collisions')
        const safePosition = findSafePosition(jubeeRect, collidingElements)
        
        if (safePosition) {
          console.log('[Jubee Collision] Moving to safe position:', safePosition)
          setContainerPosition(safePosition)
        }
      }
    } finally {
      checkingRef.current = false
    }
  }, [containerRef, getElementRect, checkCollision, findSafePosition, setContainerPosition])

  // Run collision detection frequently during initial page load
  useEffect(() => {
    // Run immediately
    const timeoutId1 = setTimeout(detectAndResolveCollisions, 100)
    
    // Run multiple times during initial load to catch late-rendering elements
    const timeoutId2 = setTimeout(detectAndResolveCollisions, 500)
    const timeoutId3 = setTimeout(detectAndResolveCollisions, 1000)
    const timeoutId4 = setTimeout(detectAndResolveCollisions, 2000)

    return () => {
      clearTimeout(timeoutId1)
      clearTimeout(timeoutId2)
      clearTimeout(timeoutId3)
      clearTimeout(timeoutId4)
    }
  }, [detectAndResolveCollisions])

  // Re-check on window resize
  useEffect(() => {
    const handleResize = () => {
      setTimeout(detectAndResolveCollisions, 150)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [detectAndResolveCollisions])

  // Re-check when new elements are added to DOM (mutation observer)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTimeout(detectAndResolveCollisions, 100)
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => observer.disconnect()
  }, [detectAndResolveCollisions])

  // Periodic position sanity check - validate every 3 seconds
  useEffect(() => {
    const sanityCheckInterval = setInterval(() => {
      const { containerPosition, setContainerPosition } = useJubeeStore.getState()
      const validatedPosition = validatePosition(containerPosition)
      
      // If position needed correction, apply it
      if (validatedPosition.bottom !== containerPosition.bottom || 
          validatedPosition.right !== containerPosition.right) {
        console.log('[Jubee Collision] Sanity check: correcting position from', containerPosition, 'to', validatedPosition)
        setContainerPosition(validatedPosition)
      }
    }, 3000)

    return () => clearInterval(sanityCheckInterval)
  }, [validatePosition])

  return { detectAndResolveCollisions }
}
