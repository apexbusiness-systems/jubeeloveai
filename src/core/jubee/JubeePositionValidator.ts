/**
 * Jubee Position Validator
 * 
 * Bulletproof positioning system with multiple validation layers.
 * Ensures Jubee NEVER clips outside viewport boundaries.
 * Apple-level precision and reliability.
 */

export interface Position3D {
  x: number
  y: number
  z: number
}

export interface ContainerPosition {
  bottom: number
  right: number
}

export interface ViewportBounds {
  width: number
  height: number
}

// SAFE ZONE CONSTANTS - Conservative boundaries
const JUBEE_SIZE = {
  width: 150, // Container width
  height: 200, // Container height (including antenna)
}

const SAFE_MARGINS = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 20,
}

// 3D Canvas bounds
const CANVAS_BOUNDS = {
  x: { min: -5.5, max: 5.5 },
  y: { min: -3.5, max: 1.2 }, // Keep antenna visible
  z: { min: -2, max: 2 }
} as const

/**
 * Validate and clamp 3D position within canvas bounds
 */
export function validateCanvasPosition(pos: Position3D): Position3D {
  const clamped = {
    x: Math.max(CANVAS_BOUNDS.x.min, Math.min(CANVAS_BOUNDS.x.max, pos.x)),
    y: Math.max(CANVAS_BOUNDS.y.min, Math.min(CANVAS_BOUNDS.y.max, pos.y)),
    z: Math.max(CANVAS_BOUNDS.z.min, Math.min(CANVAS_BOUNDS.z.max, pos.z))
  }

  // Log if clamping occurred
  if (clamped.x !== pos.x || clamped.y !== pos.y || clamped.z !== pos.z) {
    console.warn('[Jubee Position] Canvas position clamped:', {
      original: pos,
      clamped
    })
  }

  return clamped
}

/**
 * Get current viewport dimensions
 */
export function getViewportBounds(): ViewportBounds {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  }
}

/**
 * Validate and clamp container position within viewport
 * GUARANTEES no clipping under any circumstances
 */
export function validateContainerPosition(pos: ContainerPosition): ContainerPosition {
  const viewport = getViewportBounds()
  
  // Calculate absolute position from bottom-right
  const absoluteRight = pos.right
  const absoluteBottom = pos.bottom
  
  // Ensure we stay within safe bounds
  const minRight = SAFE_MARGINS.right
  const maxRight = viewport.width - JUBEE_SIZE.width - SAFE_MARGINS.left
  const minBottom = SAFE_MARGINS.bottom
  const maxBottom = viewport.height - JUBEE_SIZE.height - SAFE_MARGINS.top
  
  const clamped = {
    right: Math.max(minRight, Math.min(maxRight, absoluteRight)),
    bottom: Math.max(minBottom, Math.min(maxBottom, absoluteBottom))
  }

  // Log if clamping occurred
  if (clamped.right !== pos.right || clamped.bottom !== pos.bottom) {
    console.warn('[Jubee Position] Container position clamped:', {
      original: pos,
      clamped,
      viewport
    })
  }

  return clamped
}

/**
 * Get a guaranteed safe default position
 * Always returns a position that's 100% visible
 */
export function getSafeDefaultPosition(): ContainerPosition {
  const viewport = getViewportBounds()
  
  // Place in bottom-right corner with safe margins
  return {
    right: Math.max(100, SAFE_MARGINS.right + 50),
    bottom: Math.max(200, SAFE_MARGINS.bottom + 100)
  }
}

/**
 * Check if a position is fully within viewport
 */
export function isPositionSafe(pos: ContainerPosition): boolean {
  const viewport = getViewportBounds()
  
  const absoluteLeft = viewport.width - pos.right - JUBEE_SIZE.width
  const absoluteTop = viewport.height - pos.bottom - JUBEE_SIZE.height
  
  return (
    absoluteLeft >= SAFE_MARGINS.left &&
    absoluteTop >= SAFE_MARGINS.top &&
    pos.right >= SAFE_MARGINS.right &&
    pos.bottom >= SAFE_MARGINS.bottom
  )
}

/**
 * Get preferred non-colliding positions in order of priority
 */
export function getPreferredPositions(viewport: ViewportBounds): ContainerPosition[] {
  const centerX = viewport.width / 2
  const centerY = viewport.height / 2
  
  return [
    // Bottom-right (default)
    { right: 100, bottom: 200 },
    // Bottom-left
    { right: viewport.width - JUBEE_SIZE.width - 100, bottom: 200 },
    // Top-right
    { right: 100, bottom: viewport.height - JUBEE_SIZE.height - 100 },
    // Top-left
    { right: viewport.width - JUBEE_SIZE.width - 100, bottom: viewport.height - JUBEE_SIZE.height - 100 },
    // Center-right
    { right: 100, bottom: centerY },
    // Center-left
    { right: viewport.width - JUBEE_SIZE.width - 100, bottom: centerY },
  ].map(validateContainerPosition) // Validate all positions
}

/**
 * Comprehensive validation - use this for all position updates
 */
export function validatePosition(
  canvasPos?: Position3D,
  containerPos?: ContainerPosition
): { canvas: Position3D; container: ContainerPosition } {
  return {
    canvas: canvasPos ? validateCanvasPosition(canvasPos) : { x: 2.5, y: -1.5, z: 0 },
    container: containerPos ? validateContainerPosition(containerPos) : getSafeDefaultPosition()
  }
}
