/**
 * Jubee Draggable Hook
 *
 * Enables dragging the Jubee container around the screen
 * with smooth animations and position persistence.
 */

import { useCallback, useRef, useEffect } from 'react'
import { useJubeeStore } from '@/store/useJubeeStore'
import { validatePosition, getContainerDimensions, calculateMaxBoundaries } from '@/core/jubee/JubeePositionManager'

interface DragState {
  isDragging: boolean
  startX: number
  startY: number
  startBottom: number
  startRight: number
  velocityX: number
  velocityY: number
  lastX: number
  lastY: number
  lastTime: number
}

// Physics constants for smooth dragging
const FRICTION = 0.94 // Friction coefficient for exponential decay (higher = less friction)
const VELOCITY_THRESHOLD = 0.3 // Minimum velocity to continue momentum (px/frame)
const MAX_VELOCITY = 50 // Cap maximum velocity to prevent extreme flicks
const BOUNCE_DAMPING = 0.5 // Energy loss when bouncing off boundaries

export function useJubeeDraggable(containerRef: React.RefObject<HTMLDivElement>) {
  const { containerPosition, setContainerPosition, setIsDragging } = useJubeeStore()
  const momentumAnimationRef = useRef<number | null>(null)
  const dragStateRef = useRef<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startBottom: 0,
    startRight: 0,
    velocityX: 0,
    velocityY: 0,
    lastX: 0,
    lastY: 0,
    lastTime: 0
  })

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return
    
    // Only start drag if clicking on the container itself, not buttons
    const target = e.target as HTMLElement
    if (target.closest('button')) return

    e.preventDefault()
    
    console.group('[🔍 DIAGNOSTIC] Drag Start')
    console.log('Mouse position:', { x: e.clientX, y: e.clientY })
    console.log('Container rect:', containerRef.current.getBoundingClientRect())
    console.log('Viewport:', { width: window.innerWidth, height: window.innerHeight })
    console.groupEnd()
    
    // Cancel any ongoing momentum animation
    if (momentumAnimationRef.current) {
      cancelAnimationFrame(momentumAnimationRef.current)
      momentumAnimationRef.current = null
    }
    
    const rect = containerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const now = performance.now()
    
    dragStateRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startBottom: viewportHeight - rect.bottom,
      startRight: viewportWidth - rect.right,
      velocityX: 0,
      velocityY: 0,
      lastX: e.clientX,
      lastY: e.clientY,
      lastTime: now
    }
    
    setIsDragging(true)
    containerRef.current.style.cursor = 'grabbing'
    containerRef.current.style.transition = 'none' // Disable transitions during drag
    document.body.style.userSelect = 'none'
    
    console.log('[Jubee Drag] Started with smooth momentum')
  }, [containerRef, setIsDragging])

  // Use centralized position validation
  const validateBoundaries = useCallback((bottom: number, right: number) => {
    return validatePosition({ bottom, right });
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStateRef.current.isDragging || !containerRef.current) return
    
    e.preventDefault()
    
    const now = performance.now()
    const deltaTime = now - dragStateRef.current.lastTime
    
    // Calculate velocity for momentum
    if (deltaTime > 0) {
      dragStateRef.current.velocityX = (e.clientX - dragStateRef.current.lastX) / deltaTime * 16 // Normalize to 60fps
      dragStateRef.current.velocityY = (e.clientY - dragStateRef.current.lastY) / deltaTime * 16
    }
    
    dragStateRef.current.lastX = e.clientX
    dragStateRef.current.lastY = e.clientY
    dragStateRef.current.lastTime = now
    
    const deltaX = e.clientX - dragStateRef.current.startX
    const deltaY = e.clientY - dragStateRef.current.startY
    
    // Calculate new position (in bottom/right coordinates)
    const newBottom = dragStateRef.current.startBottom - deltaY
    const newRight = dragStateRef.current.startRight - deltaX
    
    // Apply defensive boundary validation
    const validated = validateBoundaries(newBottom, newRight)
    
    // Apply position immediately for smooth dragging with GPU acceleration
    containerRef.current.style.bottom = `${validated.bottom}px`
    containerRef.current.style.right = `${validated.right}px`
    containerRef.current.style.willChange = 'bottom, right'
  }, [containerRef, validateBoundaries])

  const applyMomentum = useCallback(() => {
    if (!containerRef.current) return
    
    const state = dragStateRef.current
    
    // Cap velocities to prevent extreme flicks
    state.velocityX = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, state.velocityX))
    state.velocityY = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, state.velocityY))
    
    // Calculate speed (magnitude of velocity vector)
    const speed = Math.sqrt(state.velocityX ** 2 + state.velocityY ** 2)
    
    // Stop if below threshold
    if (speed < VELOCITY_THRESHOLD) {
      const rect = containerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      
      const finalBottom = viewportHeight - rect.bottom
      const finalRight = viewportWidth - rect.right
      const validated = validateBoundaries(finalBottom, finalRight)
      
      // Re-enable transitions for final settle
      containerRef.current.style.transition = 'bottom 0.2s cubic-bezier(0.4, 0, 0.2, 1), right 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
      containerRef.current.style.bottom = `${validated.bottom}px`
      containerRef.current.style.right = `${validated.right}px`
      containerRef.current.style.willChange = 'auto'
      
      setContainerPosition(validated)
      momentumAnimationRef.current = null
      
      console.log('[Jubee Inertia] Settled at:', validated)
      return
    }
    
    // Get current position
    const rect = containerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    
    let currentBottom = viewportHeight - rect.bottom
    let currentRight = viewportWidth - rect.right
    
    // Apply velocity to position
    const newBottom = currentBottom - state.velocityY
    const newRight = currentRight - state.velocityX
    
    // Get boundaries from centralized manager
    const { minBottom, minRight, maxBottom, maxRight } = calculateMaxBoundaries()
    
    let finalBottom = newBottom
    let finalRight = newRight
    let bounceX = false
    let bounceY = false
    
    // Check boundaries and apply bounce effect
    if (finalBottom < minBottom) {
      finalBottom = minBottom
      state.velocityY = -state.velocityY * BOUNCE_DAMPING
      bounceY = true
    } else if (finalBottom > maxBottom) {
      finalBottom = maxBottom
      state.velocityY = -state.velocityY * BOUNCE_DAMPING
      bounceY = true
    }
    
    if (finalRight < minRight) {
      finalRight = minRight
      state.velocityX = -state.velocityX * BOUNCE_DAMPING
      bounceX = true
    } else if (finalRight > maxRight) {
      finalRight = maxRight
      state.velocityX = -state.velocityX * BOUNCE_DAMPING
      bounceX = true
    }
    
    // Apply exponential friction decay (only if not bouncing)
    if (!bounceX) state.velocityX *= FRICTION
    if (!bounceY) state.velocityY *= FRICTION
    
    // Update position
    containerRef.current.style.bottom = `${finalBottom}px`
    containerRef.current.style.right = `${finalRight}px`
    
    // Continue animation
    momentumAnimationRef.current = requestAnimationFrame(applyMomentum)
  }, [containerRef, validateBoundaries, setContainerPosition])

  const handleMouseUp = useCallback(() => {
    if (!dragStateRef.current.isDragging || !containerRef.current) return
    
    dragStateRef.current.isDragging = false
    setIsDragging(false)
    containerRef.current.style.cursor = 'grab'
    document.body.style.userSelect = ''
    
    // Check if velocity is significant enough for momentum
    const speed = Math.sqrt(
      dragStateRef.current.velocityX ** 2 + dragStateRef.current.velocityY ** 2
    )
    
    if (speed > VELOCITY_THRESHOLD) {
      console.log('[Jubee Inertia] Starting flick with velocity:', {
        vx: dragStateRef.current.velocityX.toFixed(2),
        vy: dragStateRef.current.velocityY.toFixed(2),
        speed: speed.toFixed(2)
      })
      
      // Start momentum animation
      applyMomentum()
    } else {
      // No momentum, just save position
      const rect = containerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      
      const finalBottom = viewportHeight - rect.bottom
      const finalRight = viewportWidth - rect.right
      const validated = validateBoundaries(finalBottom, finalRight)
      
      containerRef.current.style.transition = 'bottom 0.4s cubic-bezier(0.4, 0, 0.2, 1), right 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      containerRef.current.style.willChange = 'auto'
      
      setContainerPosition(validated)
      console.log('[Jubee Drag] Ended without momentum at:', validated)
    }
  }, [containerRef, setIsDragging, setContainerPosition, validateBoundaries, applyMomentum])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!containerRef.current) return
    
    const target = e.target as HTMLElement
    if (target.closest('button')) return
    
    // Cancel any ongoing momentum animation
    if (momentumAnimationRef.current) {
      cancelAnimationFrame(momentumAnimationRef.current)
      momentumAnimationRef.current = null
    }
    
    const touch = e.touches[0]
    const rect = containerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const now = performance.now()
    
    dragStateRef.current = {
      isDragging: true,
      startX: touch.clientX,
      startY: touch.clientY,
      startBottom: viewportHeight - rect.bottom,
      startRight: viewportWidth - rect.right,
      velocityX: 0,
      velocityY: 0,
      lastX: touch.clientX,
      lastY: touch.clientY,
      lastTime: now
    }
    
    setIsDragging(true)
    containerRef.current.style.cursor = 'grabbing'
    containerRef.current.style.transition = 'none'
    document.body.style.userSelect = 'none'
    
    console.log('[Jubee Drag] Touch started with momentum')
  }, [containerRef, setIsDragging])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!dragStateRef.current.isDragging || !containerRef.current) return
    
    e.preventDefault()
    
    const now = performance.now()
    const touch = e.touches[0]
    
    // Calculate velocity for momentum
    if (now - dragStateRef.current.lastTime > 0) {
      const deltaTime = now - dragStateRef.current.lastTime
      dragStateRef.current.velocityX = (touch.clientX - dragStateRef.current.lastX) / deltaTime * 16
      dragStateRef.current.velocityY = (touch.clientY - dragStateRef.current.lastY) / deltaTime * 16
    }
    
    dragStateRef.current.lastX = touch.clientX
    dragStateRef.current.lastY = touch.clientY
    dragStateRef.current.lastTime = now
    
    const deltaX = touch.clientX - dragStateRef.current.startX
    const deltaY = touch.clientY - dragStateRef.current.startY
    
    const newBottom = dragStateRef.current.startBottom - deltaY
    const newRight = dragStateRef.current.startRight - deltaX
    
    // Apply defensive boundary validation
    const validated = validateBoundaries(newBottom, newRight)
    
    containerRef.current.style.bottom = `${validated.bottom}px`
    containerRef.current.style.right = `${validated.right}px`
    containerRef.current.style.willChange = 'bottom, right'
  }, [containerRef, validateBoundaries])

  const handleTouchEnd = useCallback(() => {
    if (!dragStateRef.current.isDragging || !containerRef.current) return
    
    dragStateRef.current.isDragging = false
    setIsDragging(false)
    
    // Check if velocity is significant enough for momentum
    const speed = Math.sqrt(
      dragStateRef.current.velocityX ** 2 + dragStateRef.current.velocityY ** 2
    )
    
    if (speed > VELOCITY_THRESHOLD) {
      console.log('[Jubee Inertia] Starting touch flick with velocity:', {
        vx: dragStateRef.current.velocityX.toFixed(2),
        vy: dragStateRef.current.velocityY.toFixed(2),
        speed: speed.toFixed(2)
      })
      
      // Start momentum animation
      applyMomentum()
    } else {
      // No momentum, just save position
      const rect = containerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      
      const finalBottom = viewportHeight - rect.bottom
      const finalRight = viewportWidth - rect.right
      const validated = validateBoundaries(finalBottom, finalRight)
      
      containerRef.current.style.transition = 'bottom 0.4s cubic-bezier(0.4, 0, 0.2, 1), right 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      containerRef.current.style.willChange = 'auto'
      
      setContainerPosition(validated)
      console.log('[Jubee Touch] Ended without momentum at:', validated)
    }
  }, [containerRef, setIsDragging, setContainerPosition, validateBoundaries, applyMomentum])

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
      // Cancel any ongoing momentum animation
      if (momentumAnimationRef.current) {
        cancelAnimationFrame(momentumAnimationRef.current)
        momentumAnimationRef.current = null
      }
      
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
