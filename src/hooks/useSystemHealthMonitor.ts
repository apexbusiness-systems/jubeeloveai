/**
 * System Health Monitor Hook
 * 
 * Continuous monitoring of all critical systems with automatic recovery.
 * Integrates all regression guards and failsafes into a unified health monitoring system.
 * 
 * Route-aware: Skips Jubee-specific checks on routes where Jubee is not rendered
 * (e.g., /landing, /auth) to prevent false positive "critical failures."
 */

import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { runSystemHealthCheck, autoFixSystemIssues, type SystemHealthReport } from '@/lib/systemHealthCheck'
import { logger } from '@/lib/logger'

// Routes where Jubee is intentionally not rendered (includes root since it redirects to /landing)
const JUBEE_EXCLUDED_ROUTES = ['/landing', '/auth', '/oauth/consent', '/']

interface HealthMonitorConfig {
  enabled: boolean
  checkIntervalMs: number
  autoFixEnabled: boolean
  logResults: boolean
}

const monitorEnabled =
  import.meta.env.DEV ||
  (import.meta.env.VITE_HEALTH_MONITOR_ENABLED === 'true')

const DEFAULT_CONFIG: HealthMonitorConfig = {
  enabled: monitorEnabled,
  checkIntervalMs: 120000, // 2 minutes to reduce overhead
  autoFixEnabled: import.meta.env.DEV, // safer to auto-fix only in dev
  logResults: import.meta.env.DEV, // Only log in dev
}

export function useSystemHealthMonitor(config: Partial<HealthMonitorConfig> = {}) {
  // Get current route to filter Jubee-specific checks
  let currentRoute = '/'
  try {
    // useLocation may throw if not in Router context
    const location = useLocation()
    currentRoute = location.pathname
  } catch {
    // Not in Router context, use default
  }
  
  const isJubeeExcludedRoute = JUBEE_EXCLUDED_ROUTES.some(route => currentRoute.startsWith(route))
  
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const [healthReport, setHealthReport] = useState<SystemHealthReport | null>(null)
  const [isHealthy, setIsHealthy] = useState(true)
  const lastCheckRef = useRef<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!finalConfig.enabled) {
      logger.dev('[System Health Monitor] Disabled')
      return
    }

    logger.dev('[System Health Monitor] Starting continuous monitoring...')

    async function performHealthCheck() {
      const now = Date.now()
      
      // Throttle checks to prevent excessive monitoring
      if (now - lastCheckRef.current < 10000) {
        return
      }
      
      lastCheckRef.current = now

      try {
        // Run comprehensive health check
        const report = await runSystemHealthCheck()
        
        // Filter out Jubee-related failures on excluded routes to prevent false positives
        const filteredReport: SystemHealthReport = isJubeeExcludedRoute
          ? {
              ...report,
              results: report.results.filter(r => !r.system.toLowerCase().includes('jubee')),
              criticalFailures: report.results
                .filter(r => !r.system.toLowerCase().includes('jubee'))
                .filter(r => r.severity === 'critical' && !r.passed).length,
              warnings: report.results
                .filter(r => !r.system.toLowerCase().includes('jubee'))
                .filter(r => r.severity === 'warning' && !r.passed).length,
            }
          : report
        
        // Recalculate overall health for filtered report
        const filteredCritical = filteredReport.criticalFailures
        filteredReport.overallHealth = filteredCritical > 0 ? 'critical' : filteredReport.warnings > 0 ? 'degraded' : 'healthy'
        
        setHealthReport(filteredReport)
        setIsHealthy(filteredReport.overallHealth !== 'critical')

        // Auto-fix if enabled and issues detected
        if (finalConfig.autoFixEnabled && filteredReport.criticalFailures > 0) {
          logger.warn('[System Health Monitor] Critical failures detected - attempting auto-fix')
          const fixed = await autoFixSystemIssues()
          
          if (fixed) {
            logger.info('[System Health Monitor] Auto-fix applied successfully')
            // Re-run health check after fix
            const updatedReport = await runSystemHealthCheck()
            setHealthReport(updatedReport)
            setIsHealthy(updatedReport.overallHealth !== 'critical')
          }
        }

        // Log results in dev mode or if explicitly enabled
        if (finalConfig.logResults || import.meta.env.DEV) {
          // Log health check summary
          const statusIcon = 
            filteredReport.overallHealth === 'healthy' ? '✅' :
            filteredReport.overallHealth === 'degraded' ? '⚠️' :
            '❌';
          
          if (filteredReport.overallHealth !== 'healthy') {
            logger.group('[System Health Check]');
            logger.info(`${statusIcon} Overall Health: ${filteredReport.overallHealth.toUpperCase()}`);
            logger.info(`Critical Failures: ${filteredReport.criticalFailures}`);
            logger.info(`Warnings: ${filteredReport.warnings}`);
            
            filteredReport.results
              .filter(r => !r.passed)
              .forEach(result => {
                const level = result.severity === 'critical' ? 'error' : 'warn';
                logger[level](`[${result.system}] ${result.message}`);
              });
            
            logger.groupEnd();
            
            if (filteredReport.overallHealth === 'critical') {
              logger.error('[System Health] CRITICAL FAILURES DETECTED - Immediate attention required');
            }
          }
        }
      } catch (error) {
        logger.error('[System Health Monitor] Health check failed:', error)
        setIsHealthy(false)
      }
    }

    // Initial check
    performHealthCheck()

    // Set up periodic checks
    intervalRef.current = setInterval(performHealthCheck, finalConfig.checkIntervalMs)

    // Check on visibility change (user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        performHealthCheck()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      logger.dev('[System Health Monitor] Stopped')
    }
  }, [finalConfig.enabled, finalConfig.checkIntervalMs, finalConfig.autoFixEnabled, finalConfig.logResults, isJubeeExcludedRoute])

  return {
    healthReport,
    isHealthy,
    lastCheck: lastCheckRef.current,
  }
}
