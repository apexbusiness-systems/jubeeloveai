/**
 * Jubee Draggable Hook
 *
 * Enables dragging the Jubee container around the screen
 * with smooth animations and position persistence.
 */

import { useCallback, useRef, useEffect } from 'react'
import { useJubeeStore } from '@/store/useJubeeStore'
import { getContainerDimensions } from '@/core/jubee/JubeeDom'

interface DragState {
  isDragging: boolean
  startX: number
  startY: number
  startBottom: number
  startRight: number
}

// Boundary constants to prevent edge clipping while allowing full viewport access
const SAFE_MARGIN = 10 // Small margin to prevent edge clipping (reduced from 50 for better corner access)

export function useJubeeDraggable(containerRef: React.RefObject<HTMLDivElement>) {
  const { containerPosition, setContainerPosition, setIsDragging } = useJubeeStore()
  const dragStateRef = useRef<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startBottom: 0,
    startRight: 0
  })

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return
    
    // Only start drag if clicking on the container itself, not buttons
    const target = e.target as HTMLElement
    if (target.closest('button')) return

    e.preventDefault()
    
    const rect = containerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    
    dragStateRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startBottom: viewportHeight - rect.bottom,
      startRight: viewportWidth - rect.right
    }
    
    setIsDragging(true)
    containerRef.current.style.cursor = 'grabbing'
    document.body.style.userSelect = 'none'
    
    console.log('[Jubee Drag] Started')
  }, [containerRef, setIsDragging])

  const validateBoundaries = useCallback((bottom: number, right: number): { bottom: number; right: number } => {
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const containerDims = getContainerDimensions()

    // Calculate bounds to keep container fully visible within viewport
    // Allow dragging to all edges with SAFE_MARGIN to prevent clipping
    const minBottom = SAFE_MARGIN // Allow dragging to top of screen
    const minRight = SAFE_MARGIN // Allow dragging to left edge
    const maxBottom = viewportHeight - containerDims.height - SAFE_MARGIN // Prevent bottom overflow
    const maxRight = viewportWidth - containerDims.width - SAFE_MARGIN // Prevent right overflow

    // Additional NaN/Infinity guards with safe defaults
    const safeBottom = Number.isFinite(bottom) ? bottom : 200
    const safeRight = Number.isFinite(right) ? right : 100

    // Clamp to viewport bounds - allowing FULL viewport dragging
    return {
      bottom: Math.max(minBottom, Math.min(maxBottom, safeBottom)),
      right: Math.max(minRight, Math.min(maxRight, safeRight))
    }
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStateRef.current.isDragging || !containerRef.current) return
    
    e.preventDefault()
    
    const deltaX = e.clientX - dragStateRef.current.startX
    const deltaY = e.clientY - dragStateRef.current.startY
    
    // Calculate new position (in bottom/right coordinates)
    const newBottom = dragStateRef.current.startBottom - deltaY
    const newRight = dragStateRef.current.startRight - deltaX
    
    // Apply defensive boundary validation
    const validated = validateBoundaries(newBottom, newRight)
    
    // Apply position immediately for smooth dragging
    containerRef.current.style.bottom = `${validated.bottom}px`
    containerRef.current.style.right = `${validated.right}px`
  }, [containerRef, validateBoundaries])

  const handleMouseUp = useCallback(() => {
    if (!dragStateRef.current.isDragging || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    
    const finalBottom = viewportHeight - rect.bottom
    const finalRight = viewportWidth - rect.right
    
    // Apply final boundary validation before persisting
    const validated = validateBoundaries(finalBottom, finalRight)
    
    dragStateRef.current.isDragging = false
    setIsDragging(false)
    containerRef.current.style.cursor = 'grab'
    document.body.style.userSelect = ''
    
    // Save validated final position to store
    setContainerPosition(validated)
    
    console.log('[Jubee Drag] Ended at validated position:', validated)
  }, [containerRef, setIsDragging, setContainerPosition, validateBoundaries])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!containerRef.current) return
    
    const target = e.target as HTMLElement
    if (target.closest('button')) return
    
    const touch = e.touches[0]
    const rect = containerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    
    dragStateRef.current = {
      isDragging: true,
      startX: touch.clientX,
      startY: touch.clientY,
      startBottom: viewportHeight - rect.bottom,
      startRight: viewportWidth - rect.right
    }
    
    setIsDragging(true)
    console.log('[Jubee Drag] Touch started')
  }, [containerRef, setIsDragging])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!dragStateRef.current.isDragging || !containerRef.current) return
    
    e.preventDefault()
    
    const touch = e.touches[0]
    const deltaX = touch.clientX - dragStateRef.current.startX
    const deltaY = touch.clientY - dragStateRef.current.startY
    
    const newBottom = dragStateRef.current.startBottom - deltaY
    const newRight = dragStateRef.current.startRight - deltaX
    
    // Apply defensive boundary validation
    const validated = validateBoundaries(newBottom, newRight)
    
    containerRef.current.style.bottom = `${validated.bottom}px`
    containerRef.current.style.right = `${validated.right}px`
  }, [containerRef, validateBoundaries])

  const handleTouchEnd = useCallback(() => {
    if (!dragStateRef.current.isDragging || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    
    const finalBottom = viewportHeight - rect.bottom
    const finalRight = viewportWidth - rect.right
    
    // Apply final boundary validation before persisting
    const validated = validateBoundaries(finalBottom, finalRight)
    
    dragStateRef.current.isDragging = false
    setIsDragging(false)
    
    setContainerPosition(validated)
    
    console.log('[Jubee Drag] Touch ended at validated position:', validated)
  }, [containerRef, setIsDragging, setContainerPosition, validateBoundaries])

  // Attach event listeners
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)

    // Set initial cursor
    container.style.cursor = 'grab'

    return () => {
      container.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      
      container.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [containerRef, handleMouseDown, handleMouseMove, handleMouseUp, handleTouchStart, handleTouchMove, handleTouchEnd])

  return { isDragging: dragStateRef.current.isDragging }
}
