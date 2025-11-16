/**
 * Jubee Collision Detection Hook
 *
 * Detects overlaps between Jubee and UI elements (cards, buttons, header)
 * and automatically repositions Jubee to avoid overlapping.
 */

import { useEffect, useCallback, useRef } from 'react'
import { useJubeeStore } from '@/store/useJubeeStore'
import { getContainerDimensions } from '@/core/jubee/JubeeDom'

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
const SAFE_MARGIN = 50 // Margin to prevent edge clipping

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
    const containerDims = getContainerDimensions()

    // Calculate absolute maximum right that keeps container fully visible
    // right value is distance from right edge, so we need to ensure:
    // viewportWidth - right - containerDims.width >= 0 (left edge is on screen)
    const absoluteMaxRight = viewportWidth - containerDims.width - SAFE_MARGIN

    // Enhanced boundary calculation with generous minimums to prevent clipping
    const minBottom = 180 // Ensure above bottom navigation
    const minRight = 100 // Minimum distance from right edge
    const maxBottom = Math.max(minBottom, viewportHeight - containerDims.height - SAFE_MARGIN)
    const maxRight = Math.max(minRight, Math.min(absoluteMaxRight, 300)) // Cap at 300px from right edge
    
    // Validate with defensive boundaries
    const validated = {
      bottom: Math.max(minBottom, Math.min(maxBottom, pos.bottom)),
      right: Math.max(minRight, Math.min(maxRight, pos.right))
    }
    
    // Additional safety check: ensure values are finite and not NaN
    return {
      bottom: Number.isFinite(validated.bottom) ? validated.bottom : 200,
      right: Number.isFinite(validated.right) ? validated.right : 100
    }
  }, [])

  const findSafePosition = useCallback((
    jubeeRect: CollisionRect,
    collidingElements: CollisionRect[]
  ): { bottom: number; right: number } | null => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const containerDims = getContainerDimensions()

    // Dynamic safe zone calculation based on viewport size
    const cornerMargin = Math.max(SAFE_MARGIN, Math.min(100, viewportWidth * 0.05))
    const centerOffset = Math.max(containerDims.width / 2, Math.min(200, viewportWidth * 0.1))

    // Try positions in order of preference with dynamic zones
    const positions = [
      { bottom: 200, right: 100 }, // Default safe position
      { bottom: cornerMargin, right: cornerMargin }, // Bottom-right corner
      { bottom: cornerMargin, right: viewportWidth - containerDims.width - cornerMargin }, // Bottom-left corner
      { bottom: viewportHeight - containerDims.height - cornerMargin, right: cornerMargin }, // Top-right corner
      { bottom: viewportHeight - containerDims.height - cornerMargin, right: viewportWidth - containerDims.width - cornerMargin }, // Top-left corner
      { bottom: viewportHeight / 2 - containerDims.height / 2, right: cornerMargin }, // Middle-right
      { bottom: cornerMargin, right: viewportWidth / 2 - centerOffset } // Bottom-center
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
    return validatePosition({ bottom: 200, right: 100 })
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

  // Continuous position validation - more frequent checks with throttling
  useEffect(() => {
    let lastValidationTime = 0
    const VALIDATION_THROTTLE = 2000 // Throttle to every 2 seconds
    
    const sanityCheckInterval = setInterval(() => {
      const now = Date.now()
      if (now - lastValidationTime < VALIDATION_THROTTLE) return
      
      lastValidationTime = now
      const { containerPosition, setContainerPosition, isDragging } = useJubeeStore.getState()
      
      // Skip validation during active dragging
      if (isDragging) return
      
      const validatedPosition = validatePosition(containerPosition)
      
      // If position needed correction, apply it
      const needsCorrection = 
        Math.abs(validatedPosition.bottom - containerPosition.bottom) > 1 || 
        Math.abs(validatedPosition.right - containerPosition.right) > 1
      
      if (needsCorrection) {
        console.log('[Jubee Collision] Auto-correcting position:', { from: containerPosition, to: validatedPosition })
        setContainerPosition(validatedPosition)
      }
    }, 1000)

    return () => clearInterval(sanityCheckInterval)
  }, [validatePosition])

  return { detectAndResolveCollisions }
}
