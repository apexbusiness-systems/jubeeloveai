/**
 * Storage System Regression Guard
 * 
 * Monitors and validates storage mechanisms (IndexedDB, localStorage, Zustand)
 * to prevent data loss and corruption.
 */

import { logger } from '../logger'
import type { HealthCheckResult } from '../systemHealthCheck'

/**
 * Run storage system health checks
 */
export function runStorageHealthCheck(): HealthCheckResult[] {
  const results: HealthCheckResult[] = []
  const timestamp = Date.now()
  
  // Check 1: IndexedDB availability
  try {
    if (!window.indexedDB) {
      results.push({
        passed: false,
        system: 'IndexedDB',
        message: 'IndexedDB is not available in this browser',
        severity: 'critical',
        autoFixed: false,
        timestamp
      })
    } else {
      results.push({
        passed: true,
        system: 'IndexedDB',
        message: 'IndexedDB is available',
        severity: 'info',
        autoFixed: false,
        timestamp
      })
    }
  } catch (error) {
    results.push({
      passed: false,
      system: 'IndexedDB',
      message: `IndexedDB check failed: ${error}`,
      severity: 'critical',
      autoFixed: false,
      timestamp
    })
  }
  
  // Check 2: localStorage availability
  try {
    const testKey = '__storage_test__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    
    results.push({
      passed: true,
      system: 'localStorage',
      message: 'localStorage is functional',
      severity: 'info',
      autoFixed: false,
      timestamp
    })
  } catch (error) {
    results.push({
      passed: false,
      system: 'localStorage',
      message: `localStorage is not functional: ${error}`,
      severity: 'warning',
      autoFixed: false,
      timestamp
    })
  }
  
  // Check 3: Zustand persist middleware state
  try {
    const jubeeState = localStorage.getItem('jubee-store')
    const parentalState = localStorage.getItem('parental-store')
    
    if (jubeeState) {
      const parsed = JSON.parse(jubeeState)
      if (!parsed.state || typeof parsed.state.isVisible !== 'boolean') {
        results.push({
          passed: false,
          system: 'ZustandPersist',
          message: 'Jubee store state is corrupted',
          severity: 'critical',
          autoFixed: false,
          timestamp
        })
      } else {
        results.push({
          passed: true,
          system: 'ZustandPersist',
          message: 'Jubee store state is valid',
          severity: 'info',
          autoFixed: false,
          timestamp
        })
      }
    }
    
    if (parentalState) {
      const parsed = JSON.parse(parentalState)
      if (!parsed.state) {
        results.push({
          passed: false,
          system: 'ZustandPersist',
          message: 'Parental store state is corrupted',
          severity: 'warning',
          autoFixed: false,
          timestamp
        })
      }
    }
  } catch (error) {
    results.push({
      passed: false,
      system: 'ZustandPersist',
      message: `Zustand state validation failed: ${error}`,
      severity: 'warning',
      autoFixed: false,
      timestamp
    })
  }
  
  // Check 4: Storage quota
  if (navigator.storage && navigator.storage.estimate) {
    navigator.storage.estimate().then(estimate => {
      const usage = estimate.usage || 0
      const quota = estimate.quota || 0
      const percentUsed = (usage / quota) * 100
      
      if (percentUsed > 90) {
        results.push({
          passed: false,
          system: 'StorageQuota',
          message: `Storage is ${percentUsed.toFixed(1)}% full - cleanup recommended`,
          severity: 'warning',
          autoFixed: false,
          timestamp
        })
      } else {
        results.push({
          passed: true,
          system: 'StorageQuota',
          message: `Storage usage: ${percentUsed.toFixed(1)}%`,
          severity: 'info',
          autoFixed: false,
          timestamp
        })
      }
    }).catch(() => {
      // Silently ignore quota check errors
    })
  }
  
  return results
}

/**
 * Auto-fix storage issues
 */
export function autoFixStorageIssues(): boolean {
  let fixed = false
  
  try {
    // Fix corrupted Zustand state
    const jubeeState = localStorage.getItem('jubee-store')
    if (jubeeState) {
      const parsed = JSON.parse(jubeeState)
      if (!parsed.state || typeof parsed.state.isVisible !== 'boolean') {
        logger.warn('[Storage Guard] Fixing corrupted Jubee store state')
        localStorage.removeItem('jubee-store')
        fixed = true
      }
    }
    
    const parentalState = localStorage.getItem('parental-store')
    if (parentalState) {
      const parsed = JSON.parse(parentalState)
      if (!parsed.state) {
        logger.warn('[Storage Guard] Fixing corrupted parental store state')
        localStorage.removeItem('parental-store')
        fixed = true
      }
    }
  } catch (error) {
    logger.error('[Storage Guard] Auto-fix failed:', error)
  }
  
  return fixed
}
