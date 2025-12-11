/**
 * Central System Health Check Coordinator
 * 
 * Runs comprehensive health checks across all critical systems
 * to prevent regression and detect issues early.
 */

import { logger } from './logger'

export interface HealthCheckResult {
  passed: boolean
  system: string
  message: string
  severity: 'critical' | 'warning' | 'info'
  autoFixed: boolean
  timestamp: number
}

export interface SystemHealthReport {
  overallHealth: 'healthy' | 'degraded' | 'critical'
  results: HealthCheckResult[]
  criticalFailures: number
  warnings: number
  timestamp: number
}

/**
 * Run all system health checks
 */
export async function runSystemHealthCheck(): Promise<SystemHealthReport> {
  const results: HealthCheckResult[] = []
  const timestamp = Date.now()
  
  logger.dev('[System Health] Starting comprehensive health check...')
  
  // Import and run all guards
  const guards = await Promise.all([
    import('./regressionGuards/storageRegressionGuard').then(m => m.runStorageHealthCheck()),
    import('./regressionGuards/authRegressionGuard').then(m => m.runAuthHealthCheck()),
    import('./regressionGuards/syncRegressionGuard').then(m => m.runSyncHealthCheck()),
    import('./regressionGuards/parentalControlsGuard').then(m => m.runParentalControlsCheck()),
    import('../core/jubee/JubeeSystemCheck').then(m => {
      const jubeeResults = m.runJubeeSystemCheck()
      return jubeeResults.map(r => ({
        passed: r.passed,
        system: r.system,
        message: r.message,
        severity: r.critical ? 'critical' as const : 'warning' as const,
        autoFixed: false,
        timestamp: Date.now()
      }))
    })
  ])
  
  // Flatten results
  guards.forEach(guardResults => {
    results.push(...guardResults)
  })
  
  // Calculate health metrics
  const criticalFailures = results.filter(r => !r.passed && r.severity === 'critical').length
  const warnings = results.filter(r => !r.passed && r.severity === 'warning').length
  
  const overallHealth = 
    criticalFailures > 0 ? 'critical' :
    warnings > 0 ? 'degraded' :
    'healthy'
  
  const report: SystemHealthReport = {
    overallHealth,
    results,
    criticalFailures,
    warnings,
    timestamp
  }
  
  // Note: Logging is now handled by useSystemHealthMonitor after route-aware filtering
  // to prevent false positive "CRITICAL FAILURES" on routes where Jubee is not rendered.
  // Raw report is returned for the hook to filter and log appropriately.
  
  return report
}

/**
 * Log health report to console
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
export function logHealthReport(report: SystemHealthReport): void {
  const statusIcon = 
    report.overallHealth === 'healthy' ? '✅' :
    report.overallHealth === 'degraded' ? '⚠️' :
    '❌'
  
  logger.group('[System Health Check]')
  logger.info(`${statusIcon} Overall Health: ${report.overallHealth.toUpperCase()}`)
  logger.info(`Critical Failures: ${report.criticalFailures}`)
  logger.info(`Warnings: ${report.warnings}`)
  
  if (report.results.length > 0) {
    report.results.forEach(result => {
      const icon = result.passed ? '✅' : result.severity === 'critical' ? '🔴' : '🟡'
      const fixedTag = result.autoFixed ? ' [AUTO-FIXED]' : ''
      logger.info(`${icon} ${result.system}: ${result.message}${fixedTag}`)
    })
  }
  
  logger.groupEnd()
  
  if (report.overallHealth === 'critical') {
    logger.error('[System Health] CRITICAL FAILURES DETECTED - Immediate attention required')
  }
}

/**
 * Auto-fix all fixable issues
 */
export async function autoFixSystemIssues(): Promise<boolean> {
  logger.info('[System Health] Attempting auto-fix for all systems...')
  
  const fixes = await Promise.all([
    import('./regressionGuards/storageRegressionGuard').then(m => m.autoFixStorageIssues()),
    import('./regressionGuards/syncRegressionGuard').then(m => m.autoFixSyncIssues()),
    import('../core/jubee/JubeeRegressionGuard').then(m => m.autoFixRegressions())
  ])
  
  const anyFixed = fixes.some(fixed => fixed === true)
  
  if (anyFixed) {
    logger.info('[System Health] ✅ Auto-fixes applied successfully')
  } else {
    logger.info('[System Health] No auto-fixes needed')
  }
  
  return anyFixed
}

/**
 * Check if system is healthy enough to proceed
 */
export function isSystemHealthy(report: SystemHealthReport): boolean {
  return report.overallHealth !== 'critical'
}
