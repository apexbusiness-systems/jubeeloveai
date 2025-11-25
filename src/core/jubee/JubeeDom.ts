/**
 * JubeeDom - Canonical DOM helper for Jubee container dimensions
 *
 * This is the single source of truth for all Jubee container dimensions.
 * All Jubee modules must use this helper instead of hard-coded sizes.
 */

export interface ContainerDimensions {
  width: number;
  height: number;
}

export interface ViewportBounds {
  width: number;
  height: number;
}

export interface ContainerPosition {
  bottom: number;
  right: number;
}

export interface ContainerRect {
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
}

/**
 * Get viewport bounds (window.innerWidth/innerHeight)
 * Returns fallback if window is undefined (SSR)
 */
export function getViewportBounds(): ViewportBounds {
  if (typeof window === 'undefined') {
    return { width: 1024, height: 768 }; // Default desktop fallback
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Get container dimensions from DOM or CSS fallback
 *
 * Priority order:
 * 1. .jubee-container DOM element getBoundingClientRect()
 * 2. CSS custom properties --jubee-container-width/height from :root
 * 3. Hardcoded fallback { width: 400, height: 450 }
 */
export function getContainerDimensions(): ContainerDimensions {
  // Priority 1: DOM element if it exists
  if (typeof document !== 'undefined') {
    const container = document.querySelector('.jubee-container') as HTMLElement | null;
    if (container) {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      }
    }
  }

  // Priority 2: CSS custom properties from :root
  if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    const root = document.documentElement;
    const computedStyle = window.getComputedStyle(root);

    const cssWidth = computedStyle.getPropertyValue('--jubee-container-width').trim();
    const cssHeight = computedStyle.getPropertyValue('--jubee-container-height').trim();

    if (cssWidth && cssHeight) {
      const width = parseInt(cssWidth, 10);
      const height = parseInt(cssHeight, 10);

      if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
        return { width, height };
      }
    }
  }

  // Priority 3: Hardcoded fallback (10% smaller than original 400x450)
  return { width: 360, height: 405 };
}

/**
 * Convert container position ({bottom,right}) to absolute rectangle
 *
 * @param pos Container position with bottom/right coordinates
 * @returns Absolute rectangle using viewport and container dimensions
 */
export function getRectForContainerPosition(pos: ContainerPosition): ContainerRect {
  const viewport = getViewportBounds();
  const containerDims = getContainerDimensions();

  const bottom = Math.min(pos.bottom, viewport.height);
  const right = Math.min(pos.right, viewport.width);

  return {
    top: Math.max(0, bottom - containerDims.height),
    left: Math.max(0, right - containerDims.width),
    bottom,
    right,
    width: containerDims.width,
    height: containerDims.height,
  };
}
