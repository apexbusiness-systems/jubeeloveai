/**
 * Jubee Regression Prevention System
 * 
 * Automated checks and guards to prevent common Jubee regressions.
 * Runs on key lifecycle events to catch issues early.
 */

import { useEffect } from 'react'
import { useJubeeStore } from '@/store/useJubeeStore'
import { isPositionSafe } from './JubeePositionValidator'
import { isPositionVisible } from './JubeePositionManager'
import { logger } from '@/lib/logger'

interface RegressionCheckResult {
  passed: boolean
  issue: string
  severity: 'critical' | 'warning' | 'info'
  autoFixed: boolean
}

/**
 * Check for common Jubee regressions
 */
export function checkForRegressions(): RegressionCheckResult[] {
  const results: RegressionCheckResult[] = []
  const state = useJubeeStore.getState()
  
  // Check 1: Visibility state
  if (typeof state.isVisible !== 'boolean') {
    results.push({
      passed: false,
      issue: 'isVisible state is not a boolean',
      severity: 'critical',
      autoFixed: false
    })
  }
  
  // Check 2: Container position validity
  const containerPos = state.containerPosition
  if (!Number.isFinite(containerPos.bottom) || !Number.isFinite(containerPos.right)) {
    results.push({
      passed: false,
      issue: 'Container position contains invalid values (NaN or Infinity)',
      severity: 'critical',
      autoFixed: false
    })
  } else if (containerPos.bottom < 0 || containerPos.right < 0) {
    results.push({
      passed: false,
      issue: 'Container position has negative values',
      severity: 'critical',
      autoFixed: false
    })
  } else if (!isPositionSafe(containerPos)) {
    results.push({
      passed: false,
      issue: 'Container position is outside safe viewport bounds',
      severity: 'warning',
      autoFixed: false
    })
  } else if (!isPositionVisible(containerPos)) {
    results.push({
      passed: false,
      issue: 'Container position is not fully visible',
      severity: 'warning',
      autoFixed: false
    })
  }
  
  // Check 3: Canvas position validity
  const canvasPos = state.position
  if (!Number.isFinite(canvasPos.x) || !Number.isFinite(canvasPos.y) || !Number.isFinite(canvasPos.z)) {
    results.push({
      passed: false,
      issue: 'Canvas position contains invalid values (NaN or Infinity)',
      severity: 'critical',
      autoFixed: false
    })
  }
  
  // Check 4: Animation state
  if (typeof state.currentAnimation !== 'string' || state.currentAnimation.length === 0) {
    results.push({
      passed: false,
      issue: 'Animation state is invalid or empty',
      severity: 'warning',
      autoFixed: false
    })
  }
  
  // Check 5: Gender and voice consistency
  if (state.gender !== 'male' && state.gender !== 'female') {
    results.push({
      passed: false,
      issue: 'Gender state is invalid',
      severity: 'critical',
      autoFixed: false
    })
  }
  
  const validVoices = ['shimmer', 'nova', 'alloy', 'echo', 'fable', 'onyx']
  if (!validVoices.includes(state.voice)) {
    results.push({
      passed: false,
      issue: 'Voice state is invalid',
      severity: 'warning',
      autoFixed: false
    })
  }
  
  return results
}

/**
 * Auto-fix common regressions where possible
 */
export function autoFixRegressions(): boolean {
  const results = checkForRegressions()
  const state = useJubeeStore.getState()
  let fixed = false
  
  results.forEach(result => {
    if (!result.passed && result.severity === 'critical') {
      // Attempt to fix critical issues
      if (result.issue.includes('Container position')) {
        logger.warn('[Jubee Regression] Auto-fixing container position')
        const { getSafeDefaultPosition } = require('./JubeePositionValidator')
        state.setContainerPosition(getSafeDefaultPosition())
        fixed = true
      }
      
      if (result.issue.includes('Canvas position')) {
        logger.warn('[Jubee Regression] Auto-fixing canvas position')
        state.updatePosition({ x: 0, y: 0, z: 0 })
        fixed = true
      }
      
      if (result.issue.includes('isVisible')) {
        logger.warn('[Jubee Regression] Auto-fixing visibility state')
        // Reset to visible
        if (typeof state.isVisible !== 'boolean') {
          useJubeeStore.setState({ isVisible: true })
          fixed = true
        }
      }
      
      if (result.issue.includes('Animation state')) {
        logger.warn('[Jubee Regression] Auto-fixing animation state')
        state.triggerAnimation('idle')
        fixed = true
      }
    }
  })
  
  return fixed
}

/**
 * Log regression check results
 */
export function logRegressionCheck(): void {
  const results = checkForRegressions()
  const allPassed = results.every(r => r.passed)
  
  if (!allPassed) {
    console.group('[Jubee Regression Check]')
    console.warn('⚠️ Potential regressions detected')
    
    results.filter(r => !r.passed).forEach(result => {
      const icon = result.severity === 'critical' ? '🔴' : result.severity === 'warning' ? '🟡' : 'ℹ️'
      console.log(`${icon} [${result.severity.toUpperCase()}] ${result.issue}`)
    })
    
    console.groupEnd()
    
    // Attempt auto-fix if critical issues found
    const criticalIssues = results.filter(r => !r.passed && r.severity === 'critical')
    if (criticalIssues.length > 0) {
      const fixed = autoFixRegressions()
      if (fixed) {
        console.log('[Jubee Regression] 🔧 Auto-fix applied')
      }
    }
  } else {
    logger.dev('[Jubee Regression Check] ✅ No regressions detected')
  }
}

/**
 * React hook for automatic regression monitoring
 */
export function useJubeeRegressionGuard() {
  useEffect(() => {
    // Run check on mount
    logRegressionCheck()
    
    // Set up periodic checks in development
    if (import.meta.env.DEV) {
      const interval = setInterval(() => {
        logRegressionCheck()
      }, 30000) // Check every 30 seconds in dev
      
      return () => clearInterval(interval)
    }
  }, [])
}
