/**
 * Jubee System Health Check
 * 
 * Comprehensive validation that all Jubee systems are functioning correctly.
 * Prevents regression by verifying critical integrations.
 */

import { validatePosition, getSafeDefaultPosition } from './JubeePositionValidator'
import { validatePosition as validatePosManager, getSafeDefaultPosition as getSafeDefaultPosManager } from './JubeePositionManager'

interface SystemCheckResult {
  passed: boolean
  system: string
  message: string
  critical: boolean
}

/**
 * Run comprehensive system checks on Jubee components
 */
export function runJubeeSystemCheck(): SystemCheckResult[] {
  const results: SystemCheckResult[] = []
  
  // Check 1: Position validators are working
  try {
    const testPos = { bottom: 120, right: 100 }
    const validated = validatePosManager(testPos)
    
    if (!Number.isFinite(validated.bottom) || !Number.isFinite(validated.right)) {
      results.push({
        passed: false,
        system: 'PositionManager',
        message: 'Position validation returned invalid values',
        critical: true
      })
    } else {
      results.push({
        passed: true,
        system: 'PositionManager',
        message: 'Position validation working correctly',
        critical: true
      })
    }
  } catch (error) {
    results.push({
      passed: false,
      system: 'PositionManager',
      message: `Position validation failed: ${error}`,
      critical: true
    })
  }
  
  // Check 2: Safe default position is valid
  try {
    const safePos = getSafeDefaultPosManager()
    
    if (!Number.isFinite(safePos.bottom) || !Number.isFinite(safePos.right)) {
      results.push({
        passed: false,
        system: 'SafeDefaultPosition',
        message: 'Safe default position is invalid',
        critical: true
      })
    } else if (safePos.bottom < 0 || safePos.right < 0) {
      results.push({
        passed: false,
        system: 'SafeDefaultPosition',
        message: 'Safe default position has negative values',
        critical: true
      })
    } else {
      results.push({
        passed: true,
        system: 'SafeDefaultPosition',
        message: 'Safe default position is valid',
        critical: true
      })
    }
  } catch (error) {
    results.push({
      passed: false,
      system: 'SafeDefaultPosition',
      message: `Safe default position failed: ${error}`,
      critical: true
    })
  }
  
  // Check 3: Canvas position validation
  try {
    const testCanvasPos = { x: 0, y: 0, z: 0 }
    const validated = validatePosition(testCanvasPos, undefined)
    
    if (!validated.canvas || !Number.isFinite(validated.canvas.x)) {
      results.push({
        passed: false,
        system: 'CanvasPositionValidator',
        message: 'Canvas position validation returned invalid values',
        critical: true
      })
    } else {
      results.push({
        passed: true,
        system: 'CanvasPositionValidator',
        message: 'Canvas position validation working correctly',
        critical: true
      })
    }
  } catch (error) {
    results.push({
      passed: false,
      system: 'CanvasPositionValidator',
      message: `Canvas position validation failed: ${error}`,
      critical: true
    })
  }
  
  // Check 4: Container position validation
  try {
    const testContainerPos = { bottom: 120, right: 100 }
    const validated = validatePosition(undefined, testContainerPos)
    
    if (!validated.container || !Number.isFinite(validated.container.bottom)) {
      results.push({
        passed: false,
        system: 'ContainerPositionValidator',
        message: 'Container position validation returned invalid values',
        critical: true
      })
    } else {
      results.push({
        passed: true,
        system: 'ContainerPositionValidator',
        message: 'Container position validation working correctly',
        critical: true
      })
    }
  } catch (error) {
    results.push({
      passed: false,
      system: 'ContainerPositionValidator',
      message: `Container position validation failed: ${error}`,
      critical: true
    })
  }
  
  // Check 5: Viewport bounds calculation
  try {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }
    
    if (viewport.width <= 0 || viewport.height <= 0) {
      results.push({
        passed: false,
        system: 'ViewportBounds',
        message: 'Viewport dimensions are invalid',
        critical: true
      })
    } else {
      results.push({
        passed: true,
        system: 'ViewportBounds',
        message: 'Viewport bounds are valid',
        critical: false
      })
    }
  } catch (error) {
    results.push({
      passed: false,
      system: 'ViewportBounds',
      message: `Viewport bounds check failed: ${error}`,
      critical: false
    })
  }
  
  return results
}

/**
 * Check if all critical systems are passing
 */
export function areAllCriticalSystemsPassing(): boolean {
  const results = runJubeeSystemCheck()
  return results
    .filter(r => r.critical)
    .every(r => r.passed)
}

/**
 * Log system check results to console
 */
export function logSystemCheckResults(): void {
  const results = runJubeeSystemCheck()
  const allPassed = results.every(r => r.passed)
  
  console.group('[Jubee System Check]')
  console.log(`Overall Status: ${allPassed ? '✅ ALL SYSTEMS GO' : '❌ SYSTEMS FAILING'}`)
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌'
    const level = result.critical ? 'CRITICAL' : 'WARNING'
    console.log(`${icon} [${level}] ${result.system}: ${result.message}`)
  })
  
  console.groupEnd()
  
  if (!allPassed) {
    const criticalFailures = results.filter(r => !r.passed && r.critical)
    if (criticalFailures.length > 0) {
      console.error('[Jubee System Check] CRITICAL FAILURES DETECTED:', criticalFailures)
    }
  }
}
