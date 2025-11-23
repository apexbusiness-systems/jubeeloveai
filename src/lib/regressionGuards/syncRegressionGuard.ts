/**
 * Sync System Regression Guard
 * 
 * Monitors offline sync queue, conflict resolution, and data synchronization
 * to prevent data loss during online/offline transitions.
 */

import { logger } from '../logger'
import type { HealthCheckResult } from '../systemHealthCheck'

/**
 * Run sync system health checks
 */
export function runSyncHealthCheck(): HealthCheckResult[] {
  const results: HealthCheckResult[] = []
  const timestamp = Date.now()
  
  // Check 1: Network status detection
  try {
    const isOnline = navigator.onLine
    results.push({
      passed: true,
      system: 'NetworkDetection',
      message: `Network status: ${isOnline ? 'Online' : 'Offline'}`,
      severity: 'info',
      autoFixed: false,
      timestamp
    })
  } catch (error) {
    results.push({
      passed: false,
      system: 'NetworkDetection',
      message: `Network detection failed: ${error}`,
      severity: 'warning',
      autoFixed: false,
      timestamp
    })
  }
  
  // Check 2: Sync queue state
  try {
    const syncQueueData = localStorage.getItem('sync-queue')
    
    if (syncQueueData) {
      const queue = JSON.parse(syncQueueData)
      
      if (!Array.isArray(queue)) {
        results.push({
          passed: false,
          system: 'SyncQueue',
          message: 'Sync queue data is corrupted (not an array)',
          severity: 'critical',
          autoFixed: false,
          timestamp
        })
      } else if (queue.length > 100) {
        results.push({
          passed: false,
          system: 'SyncQueue',
          message: `Sync queue has ${queue.length} pending items - sync may be failing`,
          severity: 'warning',
          autoFixed: false,
          timestamp
        })
      } else if (queue.length > 0) {
        results.push({
          passed: true,
          system: 'SyncQueue',
          message: `${queue.length} items in sync queue`,
          severity: 'info',
          autoFixed: false,
          timestamp
        })
      } else {
        results.push({
          passed: true,
          system: 'SyncQueue',
          message: 'Sync queue is empty',
          severity: 'info',
          autoFixed: false,
          timestamp
        })
      }
    } else {
      results.push({
        passed: true,
        system: 'SyncQueue',
        message: 'No sync queue data (expected for new sessions)',
        severity: 'info',
        autoFixed: false,
        timestamp
      })
    }
  } catch (error) {
    results.push({
      passed: false,
      system: 'SyncQueue',
      message: `Sync queue validation failed: ${error}`,
      severity: 'critical',
      autoFixed: false,
      timestamp
    })
  }
  
  // Check 3: Last sync timestamp
  try {
    const lastSyncStr = localStorage.getItem('last-sync-timestamp')
    
    if (lastSyncStr) {
      const lastSync = parseInt(lastSyncStr, 10)
      const timeSinceSync = Date.now() - lastSync
      const hoursSinceSync = timeSinceSync / (1000 * 60 * 60)
      
      if (hoursSinceSync > 24) {
        results.push({
          passed: false,
          system: 'SyncStatus',
          message: `Last sync was ${hoursSinceSync.toFixed(1)} hours ago - data may be stale`,
          severity: 'warning',
          autoFixed: false,
          timestamp
        })
      } else {
        results.push({
          passed: true,
          system: 'SyncStatus',
          message: `Last sync: ${hoursSinceSync.toFixed(1)} hours ago`,
          severity: 'info',
          autoFixed: false,
          timestamp
        })
      }
    }
  } catch (error) {
    // Silently ignore last sync check errors
  }
  
  // Check 4: Conflict resolution state
  try {
    const conflictsData = localStorage.getItem('sync-conflicts')
    
    if (conflictsData) {
      const conflicts = JSON.parse(conflictsData)
      
      if (Array.isArray(conflicts) && conflicts.length > 0) {
        results.push({
          passed: false,
          system: 'ConflictResolution',
          message: `${conflicts.length} unresolved sync conflicts detected`,
          severity: 'warning',
          autoFixed: false,
          timestamp
        })
      }
    }
  } catch (error) {
    // Silently ignore conflict check errors
  }
  
  return results
}

/**
 * Auto-fix sync issues
 */
export function autoFixSyncIssues(): boolean {
  let fixed = false
  
  try {
    // Fix corrupted sync queue
    const syncQueueData = localStorage.getItem('sync-queue')
    if (syncQueueData) {
      const queue = JSON.parse(syncQueueData)
      if (!Array.isArray(queue)) {
        logger.warn('[Sync Guard] Fixing corrupted sync queue')
        localStorage.setItem('sync-queue', JSON.stringify([]))
        fixed = true
      }
    }
  } catch (error) {
    logger.error('[Sync Guard] Auto-fix failed:', error)
  }
  
  return fixed
}
