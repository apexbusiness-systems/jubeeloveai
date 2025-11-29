/**
 * Jubee Sizing Validator
 * 
 * Programmatically verifies Jubee container dimensions and 3D model scale
 * match production baseline to prevent sizing regressions.
 */

interface BaselineDimensions {
  width: number
  height: number
}

interface SizingBaseline {
  mobile: BaselineDimensions
  tablet: BaselineDimensions
  desktop: BaselineDimensions
  modelScale: number
}

// 🔒 LOCKED PRODUCTION BASELINE
const JUBEE_SIZING_BASELINE: SizingBaseline = {
  mobile: { width: 270, height: 324 },
  tablet: { width: 315, height: 360 },
  desktop: { width: 360, height: 405 },
  modelScale: 0.9 // 90% scale ratio
}

const TOLERANCE_PX = 2 // Allow 2px tolerance for rounding

/**
 * Get expected dimensions based on current viewport
 */
function getExpectedDimensions(viewportWidth: number): BaselineDimensions {
  if (viewportWidth < 768) {
    return JUBEE_SIZING_BASELINE.mobile
  } else if (viewportWidth < 1024) {
    return JUBEE_SIZING_BASELINE.tablet
  } else {
    return JUBEE_SIZING_BASELINE.desktop
  }
}

/**
 * Validate container dimensions against baseline
 */
export function validateContainerDimensions(): {
  valid: boolean
  expected: BaselineDimensions
  actual: BaselineDimensions | null
  message: string
} {
  const viewportWidth = window.innerWidth
  const expected = getExpectedDimensions(viewportWidth)
  
  // Find Jubee container in DOM
  const container = document.querySelector('[data-jubee-container="true"]') as HTMLElement
  
  if (!container) {
    return {
      valid: false,
      expected,
      actual: null,
      message: 'Jubee container not found in DOM'
    }
  }
  
  const actual = {
    width: container.offsetWidth,
    height: container.offsetHeight
  }
  
  const widthMatch = Math.abs(actual.width - expected.width) <= TOLERANCE_PX
  const heightMatch = Math.abs(actual.height - expected.height) <= TOLERANCE_PX
  
  if (!widthMatch || !heightMatch) {
    return {
      valid: false,
      expected,
      actual,
      message: `Container dimensions mismatch: expected ${expected.width}x${expected.height}, got ${actual.width}x${actual.height}`
    }
  }
  
  return {
    valid: true,
    expected,
    actual,
    message: 'Container dimensions match baseline'
  }
}

/**
 * Validate 3D model scale matches baseline ratio
 */
export function validateModelScale(): {
  valid: boolean
  expected: number
  actual: number | null
  message: string
} {
  const expected = JUBEE_SIZING_BASELINE.modelScale
  
  // Access jubeeGroup scale from Three.js scene
  // This requires the Canvas to expose the scale value
  const canvas = document.querySelector('[data-jubee-canvas="true"]') as HTMLCanvasElement
  
  if (!canvas) {
    return {
      valid: false,
      expected,
      actual: null,
      message: 'Jubee canvas not found in DOM'
    }
  }
  
  // Try to read scale from data attribute set by Canvas component
  const scaleAttr = canvas.getAttribute('data-jubee-scale')
  
  if (!scaleAttr) {
    return {
      valid: false,
      expected,
      actual: null,
      message: 'Model scale data not available (Canvas must expose scale via data-jubee-scale attribute)'
    }
  }
  
  const actual = parseFloat(scaleAttr)
  
  if (isNaN(actual)) {
    return {
      valid: false,
      expected,
      actual: null,
      message: 'Invalid model scale data'
    }
  }
  
  const scaleMatch = Math.abs(actual - expected) < 0.01 // 1% tolerance
  
  if (!scaleMatch) {
    return {
      valid: false,
      expected,
      actual,
      message: `Model scale mismatch: expected ${expected}, got ${actual}`
    }
  }
  
  return {
    valid: true,
    expected,
    actual,
    message: 'Model scale matches baseline'
  }
}

/**
 * Validate scale ratio matches container reduction
 */
export function validateScaleRatio(): {
  valid: boolean
  message: string
} {
  // Original dimensions were 10% larger (300x360 mobile, 350x400 tablet, 400x450 desktop)
  // Scale ratio should be 0.9 to match the 10% container reduction
  const expectedRatio = 0.9
  const actualScale = JUBEE_SIZING_BASELINE.modelScale
  
  if (actualScale !== expectedRatio) {
    return {
      valid: false,
      message: `Scale ratio mismatch: container reduced by 10% but model scale is ${actualScale} (expected ${expectedRatio})`
    }
  }
  
  return {
    valid: true,
    message: 'Scale ratio correctly matches container reduction'
  }
}

/**
 * Run comprehensive sizing validation
 */
export function validateJubeeSizing() {
  const containerCheck = validateContainerDimensions()
  const scaleCheck = validateModelScale()
  const ratioCheck = validateScaleRatio()
  
  return {
    containerDimensions: containerCheck,
    modelScale: scaleCheck,
    scaleRatio: ratioCheck,
    overallValid: containerCheck.valid && scaleCheck.valid && ratioCheck.valid
  }
}
