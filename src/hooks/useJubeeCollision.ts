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

  const findSafePosition = useCallback((
    jubeeRect: CollisionRect,
    collidingElements: CollisionRect[]
  ): { bottom: number; right: number } | null => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Try positions in order of preference: bottom-right, bottom-left, top-right, top-left
    const positions = [
      { bottom: 60, right: 20 }, // Default
      { bottom: 60, right: viewportWidth - jubeeRect.width - 20 },
      { bottom: viewportHeight - jubeeRect.height - 60, right: 20 },
      { bottom: viewportHeight - jubeeRect.height - 60, right: viewportWidth - jubeeRect.width - 20 },
      { bottom: viewportHeight / 2 - jubeeRect.height / 2, right: 20 },
      { bottom: 60, right: viewportWidth / 2 - jubeeRect.width / 2 }
    ]

    for (const pos of positions) {
      const testRect: CollisionRect = {
        top: viewportHeight - pos.bottom - jubeeRect.height,
        left: viewportWidth - pos.right - jubeeRect.width,
        bottom: viewportHeight - pos.bottom,
        right: viewportWidth - pos.right,
        width: jubeeRect.width,
        height: jubeeRect.height
      }

      const hasCollision = collidingElements.some(elementRect => 
        checkCollision(testRect, elementRect)
      )

      if (!hasCollision) {
        return pos
      }
    }

    return null // No safe position found, keep current
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

  // Run collision detection on mount and when layout changes
  useEffect(() => {
    const timeoutId = setTimeout(detectAndResolveCollisions, 100)

    return () => clearTimeout(timeoutId)
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

  return { detectAndResolveCollisions }
}
