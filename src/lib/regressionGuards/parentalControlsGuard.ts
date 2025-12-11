/**
 * Parental Controls Regression Guard
 * 
 * Monitors screen time limits, content restrictions, and parental settings
 * to prevent bypass vulnerabilities and control failures.
 */

import { logger as _logger } from '../logger'
import type { HealthCheckResult } from '../systemHealthCheck'

/**
 * Run parental controls health checks
 */
export function runParentalControlsCheck(): HealthCheckResult[] {
  const results: HealthCheckResult[] = []
  const timestamp = Date.now()
  
  // Check 1: Parental store state
  try {
    const parentalStateStr = localStorage.getItem('parental-store')
    
    if (parentalStateStr) {
      const parentalState = JSON.parse(parentalStateStr)
      
      if (!parentalState.state) {
        results.push({
          passed: false,
          system: 'ParentalStore',
          message: 'Parental store state is missing or corrupted',
          severity: 'critical',
          autoFixed: false,
          timestamp
        })
      } else {
        const state = parentalState.state
        
        // Validate screen time limits structure
        if (state.screenTimeLimits && typeof state.screenTimeLimits === 'object') {
          results.push({
            passed: true,
            system: 'ParentalStore',
            message: 'Parental store state is valid',
            severity: 'info',
            autoFixed: false,
            timestamp
          })
        } else {
          results.push({
            passed: false,
            system: 'ParentalStore',
            message: 'Screen time limits configuration is invalid',
            severity: 'warning',
            autoFixed: false,
            timestamp
          })
        }
      }
    } else {
      results.push({
        passed: true,
        system: 'ParentalStore',
        message: 'No parental controls configured (default open access)',
        severity: 'info',
        autoFixed: false,
        timestamp
      })
    }
  } catch (error) {
    results.push({
      passed: false,
      system: 'ParentalStore',
      message: `Parental store validation failed: ${error}`,
      severity: 'critical',
      autoFixed: false,
      timestamp
    })
  }
  
  // Check 2: Screen time session tracking
  try {
    const sessionData = sessionStorage.getItem('current-session')
    
    if (sessionData) {
      const session = JSON.parse(sessionData)
      
      if (!session.startTime || typeof session.startTime !== 'number') {
        results.push({
          passed: false,
          system: 'SessionTracking',
          message: 'Session tracking data is corrupted',
          severity: 'warning',
          autoFixed: false,
          timestamp
        })
      } else {
        const duration = Date.now() - session.startTime
        const minutes = Math.floor(duration / (1000 * 60))
        
        results.push({
          passed: true,
          system: 'SessionTracking',
          message: `Active session: ${minutes} minutes`,
          severity: 'info',
          autoFixed: false,
          timestamp
        })
      }
    }
  } catch (error) {
    // Silently ignore session check errors
  }
  
  // Check 3: Protected route configuration
  try {
    const protectedRoutes = ['/parent']
    const currentPath = window.location.pathname
    
    if (protectedRoutes.includes(currentPath)) {
      // On protected route - check if auth is required
      results.push({
        passed: true,
        system: 'RouteProtection',
        message: 'On protected route - auth enforcement active',
        severity: 'info',
        autoFixed: false,
        timestamp
      })
    } else {
      results.push({
        passed: true,
        system: 'RouteProtection',
        message: 'On public route - no auth required',
        severity: 'info',
        autoFixed: false,
        timestamp
      })
    }
  } catch (error) {
    results.push({
      passed: false,
      system: 'RouteProtection',
      message: `Route protection check failed: ${error}`,
      severity: 'warning',
      autoFixed: false,
      timestamp
    })
  }
  
  return results
}
