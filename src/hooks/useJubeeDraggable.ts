/**
 * Jubee Draggable Hook
 * 
 * Enables dragging the Jubee container around the screen
 * with smooth animations and position persistence.
 */

import { useCallback, useRef, useEffect } from 'react'
import { useJubeeStore } from '@/store/useJubeeStore'

interface DragState {
  isDragging: boolean
  startX: number
  startY: number
  startBottom: number
  startRight: number
}

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

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStateRef.current.isDragging || !containerRef.current) return
    
    e.preventDefault()
    
    const deltaX = e.clientX - dragStateRef.current.startX
    const deltaY = e.clientY - dragStateRef.current.startY
    
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const rect = containerRef.current.getBoundingClientRect()
    
    // Calculate new position (in bottom/right coordinates)
    let newBottom = dragStateRef.current.startBottom - deltaY
    let newRight = dragStateRef.current.startRight - deltaX
    
    // Constrain to viewport bounds
    const minDistance = 10
    newBottom = Math.max(minDistance, Math.min(viewportHeight - rect.height - minDistance, newBottom))
    newRight = Math.max(minDistance, Math.min(viewportWidth - rect.width - minDistance, newRight))
    
    // Apply position immediately for smooth dragging
    containerRef.current.style.bottom = `${newBottom}px`
    containerRef.current.style.right = `${newRight}px`
  }, [containerRef])

  const handleMouseUp = useCallback(() => {
    if (!dragStateRef.current.isDragging || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    
    const finalBottom = viewportHeight - rect.bottom
    const finalRight = viewportWidth - rect.right
    
    dragStateRef.current.isDragging = false
    setIsDragging(false)
    containerRef.current.style.cursor = 'grab'
    document.body.style.userSelect = ''
    
    // Save final position to store
    setContainerPosition({ bottom: finalBottom, right: finalRight })
    
    console.log('[Jubee Drag] Ended at:', { bottom: finalBottom, right: finalRight })
  }, [containerRef, setIsDragging, setContainerPosition])

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
    
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const rect = containerRef.current.getBoundingClientRect()
    
    let newBottom = dragStateRef.current.startBottom - deltaY
    let newRight = dragStateRef.current.startRight - deltaX
    
    const minDistance = 10
    newBottom = Math.max(minDistance, Math.min(viewportHeight - rect.height - minDistance, newBottom))
    newRight = Math.max(minDistance, Math.min(viewportWidth - rect.width - minDistance, newRight))
    
    containerRef.current.style.bottom = `${newBottom}px`
    containerRef.current.style.right = `${newRight}px`
  }, [containerRef])

  const handleTouchEnd = useCallback(() => {
    if (!dragStateRef.current.isDragging || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    
    const finalBottom = viewportHeight - rect.bottom
    const finalRight = viewportWidth - rect.right
    
    dragStateRef.current.isDragging = false
    setIsDragging(false)
    
    setContainerPosition({ bottom: finalBottom, right: finalRight })
    
    console.log('[Jubee Drag] Touch ended at:', { bottom: finalBottom, right: finalRight })
  }, [containerRef, setIsDragging, setContainerPosition])

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
