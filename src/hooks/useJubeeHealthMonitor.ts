/**
 * Jubee Health Monitor Hook
 * 
 * Provides comprehensive health monitoring for the Jubee mascot system.
 * Tracks metrics, logs errors, and monitors performance for early issue detection.
 */

import { useEffect, useRef, useState } from 'react'
import { useJubeeStore } from '@/store/useJubeeStore'

interface HealthMetrics {
  renderCount: number
  errorCount: number
  warningCount: number
  lastRenderTimestamp: number
  averageRenderInterval: number
  positionChanges: number
  collisionEvents: number
  recoveryAttempts: number
  webglContextLosses: number
  performanceScore: number
}

interface PerformanceEntry {
  timestamp: number
  metric: string
  value: number
  severity: 'info' | 'warn' | 'error'
}

const HEALTH_CHECK_INTERVAL = 5000 // Check health every 5 seconds
const PERFORMANCE_WINDOW = 30000 // Keep last 30 seconds of metrics
const WARNING_THRESHOLD_RENDER_GAP = 10000 // Warn if no render for 10s
const ERROR_THRESHOLD_RENDER_GAP = 20000 // Error if no render for 20s

export function useJubeeHealthMonitor() {
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'degraded' | 'critical'>('healthy')
  const metricsRef = useRef<HealthMetrics>({
    renderCount: 0,
    errorCount: 0,
    warningCount: 0,
    lastRenderTimestamp: Date.now(),
    averageRenderInterval: 0,
    positionChanges: 0,
    collisionEvents: 0,
    recoveryAttempts: 0,
    webglContextLosses: 0,
    performanceScore: 100
  })
  const performanceLogRef = useRef<PerformanceEntry[]>([])
  const renderIntervalsRef = useRef<number[]>([])

  // Log a performance metric
  const logMetric = (metric: string, value: number, severity: 'info' | 'warn' | 'error' = 'info') => {
    const entry: PerformanceEntry = {
      timestamp: Date.now(),
      metric,
      value,
      severity
    }

    performanceLogRef.current.push(entry)

    // Clean old entries
    const cutoffTime = Date.now() - PERFORMANCE_WINDOW
    performanceLogRef.current = performanceLogRef.current.filter(e => e.timestamp > cutoffTime)

    // Update metric counters
    if (severity === 'error') {
      metricsRef.current.errorCount++
    } else if (severity === 'warn') {
      metricsRef.current.warningCount++
    }
  }

  // Track render events
  const trackRender = () => {
    const now = Date.now()
    const interval = now - metricsRef.current.lastRenderTimestamp
    
    metricsRef.current.renderCount++
    metricsRef.current.lastRenderTimestamp = now

    // Track render intervals for average calculation
    renderIntervalsRef.current.push(interval)
    if (renderIntervalsRef.current.length > 100) {
      renderIntervalsRef.current.shift()
    }

    // Calculate average render interval
    const avg = renderIntervalsRef.current.reduce((a, b) => a + b, 0) / renderIntervalsRef.current.length
    metricsRef.current.averageRenderInterval = avg

    logMetric('render_interval', interval, interval > 1000 ? 'warn' : 'info')
  }

  // Track position changes
  const trackPositionChange = (from: { bottom: number; right: number }, to: { bottom: number; right: number }) => {
    metricsRef.current.positionChanges++
    const distance = Math.sqrt(
      Math.pow(to.bottom - from.bottom, 2) + Math.pow(to.right - from.right, 2)
    )
    logMetric('position_change_distance', distance)
  }

  // Track collision events
  const trackCollision = (elementCount: number) => {
    metricsRef.current.collisionEvents++
    logMetric('collision_elements', elementCount, elementCount > 5 ? 'warn' : 'info')
  }

  // Track recovery attempts
  const trackRecovery = (attemptNumber: number) => {
    metricsRef.current.recoveryAttempts++
    logMetric('recovery_attempt', attemptNumber, attemptNumber > 2 ? 'error' : 'warn')
  }

  // Track WebGL context loss
  const trackContextLoss = () => {
    metricsRef.current.webglContextLosses++
    logMetric('webgl_context_loss', 1, 'error')
  }

  // Calculate overall health score
  const calculateHealthScore = (): number => {
    let score = 100

    // Penalize for errors
    score -= metricsRef.current.errorCount * 10
    score -= metricsRef.current.warningCount * 5

    // Penalize for frequent recoveries
    if (metricsRef.current.recoveryAttempts > 0) {
      score -= metricsRef.current.recoveryAttempts * 15
    }

    // Penalize for WebGL context losses
    score -= metricsRef.current.webglContextLosses * 20

    // Penalize for render gaps
    const timeSinceLastRender = Date.now() - metricsRef.current.lastRenderTimestamp
    if (timeSinceLastRender > WARNING_THRESHOLD_RENDER_GAP) {
      score -= 20
    }
    if (timeSinceLastRender > ERROR_THRESHOLD_RENDER_GAP) {
      score -= 30
    }

    // Ensure score stays within bounds
    return Math.max(0, Math.min(100, score))
  }

  // Determine health status
  const updateHealthStatus = () => {
    const score = calculateHealthScore()
    metricsRef.current.performanceScore = score

    let status: 'healthy' | 'degraded' | 'critical' = 'healthy'
    
    if (score < 30) {
      status = 'critical'
    } else if (score < 70) {
      status = 'degraded'
    }

    setHealthStatus(status)

    // Log status changes
    if (status !== healthStatus) {
      console.log('[Jubee Health] Status changed:', { 
        from: healthStatus, 
        to: status, 
        score,
        metrics: metricsRef.current 
      })
    }
  }

  // Periodic health check
  useEffect(() => {
    const intervalId = setInterval(() => {
      updateHealthStatus()

      // Log summary metrics
      const timeSinceLastRender = Date.now() - metricsRef.current.lastRenderTimestamp
      
      if (timeSinceLastRender > WARNING_THRESHOLD_RENDER_GAP) {
        console.warn('[Jubee Health] No render activity detected for', timeSinceLastRender, 'ms')
      }

      // Reset counters periodically to prevent unbounded growth
      if (metricsRef.current.renderCount > 10000) {
        console.log('[Jubee Health] Resetting counters after', metricsRef.current.renderCount, 'renders')
        metricsRef.current.errorCount = Math.min(metricsRef.current.errorCount, 10)
        metricsRef.current.warningCount = Math.min(metricsRef.current.warningCount, 10)
      }
    }, HEALTH_CHECK_INTERVAL)

    return () => clearInterval(intervalId)
  }, [healthStatus, updateHealthStatus])

  // Monitor position changes
  useEffect(() => {
    let previousPosition = useJubeeStore.getState().containerPosition

    const unsubscribe = useJubeeStore.subscribe((state) => {
      if (
        state.containerPosition.bottom !== previousPosition.bottom ||
        state.containerPosition.right !== previousPosition.right
      ) {
        trackPositionChange(previousPosition, state.containerPosition)
        previousPosition = state.containerPosition
      }
    })

    return unsubscribe
  }, [trackPositionChange])

  return {
    healthStatus,
    metrics: metricsRef.current,
    performanceLog: performanceLogRef.current,
    trackRender,
    trackPositionChange,
    trackCollision,
    trackRecovery,
    trackContextLoss,
    logMetric
  }
}
