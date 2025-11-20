/**
 * System Health Monitor Hook
 * 
 * React hook for monitoring overall system health in development mode.
 */

import { useEffect, useRef } from 'react'
import { runSystemHealthCheck, autoFixSystemIssues } from '@/lib/systemHealthCheck'
import { logger } from '@/lib/logger'

const HEALTH_CHECK_INTERVAL = 60000 // Check every 60 seconds in dev

export function useSystemHealthMonitor() {
  const intervalRef = useRef<NodeJS.Timeout>()
  
  useEffect(() => {
    if (!import.meta.env.DEV) return
    
    // Run initial health check on mount
    logger.dev('[System Health Monitor] Starting health monitoring...')
    runSystemHealthCheck().then(report => {
      if (report.overallHealth === 'critical') {
        logger.warn('[System Health Monitor] Critical issues detected, attempting auto-fix...')
        autoFixSystemIssues()
      }
    })
    
    // Set up periodic checks in development
    intervalRef.current = setInterval(async () => {
      const report = await runSystemHealthCheck()
      
      if (report.overallHealth === 'critical') {
        logger.warn('[System Health Monitor] Critical issues detected, attempting auto-fix...')
        await autoFixSystemIssues()
        
        // Re-check after fix
        const recheckReport = await runSystemHealthCheck()
        if (recheckReport.overallHealth === 'critical') {
          logger.error('[System Health Monitor] Auto-fix unsuccessful - manual intervention required')
        } else {
          logger.info('[System Health Monitor] Auto-fix successful - system recovered')
        }
      }
    }, HEALTH_CHECK_INTERVAL)
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])
}
