/**
 * Centralized Position Management for Jubee
 * 
 * Single source of truth for all position validation and boundary calculations.
 * Eliminates conflicts between multiple hooks managing position independently.
 */

interface ContainerPosition {
  bottom: number;
  right: number;
}

interface ViewportBounds {
  width: number;
  height: number;
}

interface ContainerDimensions {
  width: number;
  height: number;
}

// Unified safe margin for consistent boundary enforcement - minimal for free movement
export const JUBEE_SAFE_MARGIN = 20;

/**
 * Get responsive container dimensions based on viewport size
 * Reduced by 50% from original to prevent blocking UI elements
 * Mobile: 135x162px (50% of original mobile)
 * Tablet: 158x180px (50% of original tablet)
 * Desktop: 180x203px (50% of original desktop)
 */
export function getResponsiveContainerDimensions(): ContainerDimensions {
  const viewport = getViewportBounds();
  
  if (viewport.width < 768) {
    // Mobile: 50% reduction
    return { width: 135, height: 162 };
  } else if (viewport.width < 1024) {
    // Tablet: 50% reduction
    return { width: 158, height: 180 };
  } else {
    // Desktop: 50% reduction
    return { width: 180, height: 203 };
  }
}

// Legacy constants for backward compatibility (50% smaller)
export const JUBEE_CONTAINER_WIDTH = 180;
export const JUBEE_CONTAINER_HEIGHT = 203;

/**
 * Get current viewport dimensions
 */
export function getViewportBounds(): ViewportBounds {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}

/**
 * Get Jubee container dimensions (now responsive)
 */
export function getContainerDimensions(): ContainerDimensions {
  return getResponsiveContainerDimensions();
}

/**
 * Calculate maximum safe boundaries to keep Jubee fully visible
 * Allows movement across entire viewport with minimal restrictions
 */
export function calculateMaxBoundaries(): { maxBottom: number; maxRight: number; minBottom: number; minRight: number } {
  const viewport = getViewportBounds();
  const container = getContainerDimensions();
  
  // Allow Jubee to move almost anywhere - just keep within visible area
  // minBottom: small margin above navigation bar (80px nav + 20px buffer)
  // maxBottom: allow movement all the way to the top (viewport height - container - small margin)
  return {
    minBottom: 100, // Above nav bar
    minRight: JUBEE_SAFE_MARGIN,
    maxBottom: viewport.height - container.height - JUBEE_SAFE_MARGIN, // Can go to top of screen
    maxRight: viewport.width - container.width - JUBEE_SAFE_MARGIN
  };
}

/**
 * Validate and clamp position to ensure Jubee stays fully within viewport
 */
export function validatePosition(position: ContainerPosition): ContainerPosition {
  const { minBottom, minRight, maxBottom, maxRight } = calculateMaxBoundaries();
  
  // Guard against NaN and Infinity
  const safeBottom = Number.isFinite(position.bottom) ? position.bottom : 120;
  const safeRight = Number.isFinite(position.right) ? position.right : 100;
  
  // Clamp to valid range
  return {
    bottom: Math.max(minBottom, Math.min(maxBottom, safeBottom)),
    right: Math.max(minRight, Math.min(maxRight, safeRight))
  };
}

/**
 * Get a safe default position (bottom-right corner with margin)
 * Adapts to viewport size to ensure full visibility
 */
export function getSafeDefaultPosition(): ContainerPosition {
  const viewport = getViewportBounds();
  const container = getContainerDimensions();
  
  // Calculate responsive default position based on viewport size
  // Mobile: Center horizontally, position near bottom
  // Tablet/Desktop: Bottom-right with comfortable margin
  const isMobile = viewport.width < 768;
  const isTablet = viewport.width >= 768 && viewport.width < 1024;
  
  let defaultBottom: number;
  let defaultRight: number;
  
  if (isMobile) {
    // Mobile: center horizontally, bottom position with extra margin
    defaultBottom = Math.max(150, JUBEE_SAFE_MARGIN);
    defaultRight = Math.max((viewport.width - container.width) / 2, JUBEE_SAFE_MARGIN);
  } else if (isTablet) {
    // Tablet: bottom-right with generous margin
    defaultBottom = Math.max(180, JUBEE_SAFE_MARGIN);
    defaultRight = Math.max(120, JUBEE_SAFE_MARGIN);
  } else {
    // Desktop: bottom-right with standard margin
    defaultBottom = Math.max(200, JUBEE_SAFE_MARGIN);
    defaultRight = Math.max(150, JUBEE_SAFE_MARGIN);
  }
  
  // Ensure it fits within viewport
  return validatePosition({
    bottom: defaultBottom,
    right: defaultRight
  });
}

/**
 * Check if a position is fully visible within the viewport
 */
export function isPositionVisible(position: ContainerPosition): boolean {
  const { minBottom, minRight, maxBottom, maxRight } = calculateMaxBoundaries();
  
  return (
    position.bottom >= minBottom &&
    position.bottom <= maxBottom &&
    position.right >= minRight &&
    position.right <= maxRight
  );
}

/**
 * Find the nearest valid position if current position is invalid
 */
export function findNearestValidPosition(position: ContainerPosition): ContainerPosition {
  // If already valid, return as-is
  if (isPositionVisible(position)) {
    return position;
  }
  
  // Otherwise, clamp to valid bounds
  return validatePosition(position);
}

/**
 * Calculate distance between two positions
 */
export function calculateDistance(pos1: ContainerPosition, pos2: ContainerPosition): number {
  const dx = pos1.right - pos2.right;
  const dy = pos1.bottom - pos2.bottom;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get preferred safe positions across the viewport
 * Returns an array of positions that are guaranteed to be fully visible
 */
export function getPreferredPositions(): ContainerPosition[] {
  const viewport = getViewportBounds();
  const container = getContainerDimensions();
  const margin = JUBEE_SAFE_MARGIN + 50; // Extra margin for comfort
  
  const positions: ContainerPosition[] = [];
  
  // Bottom-right (default)
  positions.push(validatePosition({ bottom: 120, right: 100 }));
  
  // Bottom-left
  positions.push(validatePosition({ 
    bottom: 120, 
    right: viewport.width - container.width - margin 
  }));
  
  // Top-right
  positions.push(validatePosition({ 
    bottom: viewport.height - container.height - margin, 
    right: 100 
  }));
  
  // Top-left
  positions.push(validatePosition({ 
    bottom: viewport.height - container.height - margin, 
    right: viewport.width - container.width - margin 
  }));
  
  // Center-right
  positions.push(validatePosition({ 
    bottom: (viewport.height - container.height) / 2, 
    right: 100 
  }));
  
  return positions;
}
