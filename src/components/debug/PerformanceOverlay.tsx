/**
 * Performance Overlay - Real-time debugging metrics
 * Shows FPS, memory usage, and Jubee health status
 * Only available in development mode
 */

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Activity, Eye, EyeOff } from 'lucide-react'
import { useJubeeStore } from '@/store/useJubeeStore'

interface PerformanceMetrics {
  fps: number
  memory: {
    used: number
    total: number
    limit: number
  } | null
  jubeeHealth: 'healthy' | 'degraded' | 'critical'
  renderCount: number
}

export function PerformanceOverlay() {
  const [isVisible, setIsVisible] = useState(false)
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memory: null,
    jubeeHealth: 'healthy',
    renderCount: 0,
  })

  const jubeeStore = useJubeeStore()

  // Only show in development mode
  if (import.meta.env.MODE !== 'development') {
    return null
  }

  // Track FPS
  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let animationFrameId: number

    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()
      const deltaTime = currentTime - lastTime

      if (deltaTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / deltaTime)
        
        setMetrics(prev => ({
          ...prev,
          fps,
          renderCount: prev.renderCount + frameCount,
        }))

        frameCount = 0
        lastTime = currentTime
      }

      animationFrameId = requestAnimationFrame(measureFPS)
    }

    animationFrameId = requestAnimationFrame(measureFPS)

    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  // Track memory usage
  useEffect(() => {
    const updateMemory = () => {
      if ('memory' in performance) {
        const mem = (performance as any).memory
        setMetrics(prev => ({
          ...prev,
          memory: {
            used: Math.round(mem.usedJSHeapSize / 1048576), // MB
            total: Math.round(mem.totalJSHeapSize / 1048576), // MB
            limit: Math.round(mem.jsHeapSizeLimit / 1048576), // MB
          },
        }))
      }
    }

    const interval = setInterval(updateMemory, 1000)
    updateMemory()

    return () => clearInterval(interval)
  }, [])

  // Track Jubee health (simplified - you can enhance this)
  useEffect(() => {
    const checkHealth = () => {
      // Check various health indicators
      const hasError = jubeeStore.lastError !== null
      const isProcessing = jubeeStore.isProcessing
      
      let health: 'healthy' | 'degraded' | 'critical' = 'healthy'
      
      if (hasError) {
        health = 'critical'
      } else if (isProcessing) {
        health = 'degraded'
      }

      setMetrics(prev => ({ ...prev, jubeeHealth: health }))
    }

    const interval = setInterval(checkHealth, 1000)
    checkHealth()

    return () => clearInterval(interval)
  }, [jubeeStore.lastError, jubeeStore.isProcessing])

  // Keyboard shortcut to toggle visibility (Ctrl+Shift+P)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  const getFPSColor = (fps: number) => {
    if (fps >= 55) return 'bg-green-500/20 text-green-700 border-green-500/30'
    if (fps >= 30) return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30'
    return 'bg-red-500/20 text-red-700 border-red-500/30'
  }

  const getHealthColor = (health: string) => {
    if (health === 'healthy') return 'bg-green-500/20 text-green-700 border-green-500/30'
    if (health === 'degraded') return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30'
    return 'bg-red-500/20 text-red-700 border-red-500/30'
  }

  return (
    <>
      {/* Toggle button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 right-4 z-[100] bg-background/80 backdrop-blur-sm"
        onClick={() => setIsVisible(!isVisible)}
        title="Toggle Performance Metrics (Ctrl+Shift+P)"
      >
        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>

      {/* Metrics overlay */}
      {isVisible && (
        <Card className="fixed top-16 right-4 z-[100] p-4 bg-background/95 backdrop-blur-sm border-2 w-64 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-sm">Performance Metrics</h3>
          </div>

          <div className="space-y-3">
            {/* FPS */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground">FPS</span>
                <Badge variant="outline" className={getFPSColor(metrics.fps)}>
                  {metrics.fps}
                </Badge>
              </div>
              <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${Math.min((metrics.fps / 60) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Memory */}
            {metrics.memory && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">Memory</span>
                  <span className="text-xs font-mono">
                    {metrics.memory.used}/{metrics.memory.limit} MB
                  </span>
                </div>
                <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{
                      width: `${(metrics.memory.used / metrics.memory.limit) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Jubee Health */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground">Jubee Health</span>
                <Badge variant="outline" className={getHealthColor(metrics.jubeeHealth)}>
                  {metrics.jubeeHealth}
                </Badge>
              </div>
            </div>

            {/* Render count */}
            <div className="pt-2 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Renders</span>
                <span className="text-xs font-mono">{metrics.renderCount.toLocaleString()}</span>
              </div>
            </div>

            {/* Jubee state */}
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Processing:</span>
                <span className={jubeeStore.isProcessing ? 'text-yellow-600' : 'text-green-600'}>
                  {jubeeStore.isProcessing ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Visible:</span>
                <span className={jubeeStore.isVisible ? 'text-green-600' : 'text-red-600'}>
                  {jubeeStore.isVisible ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Press <kbd className="px-1 bg-secondary rounded">Ctrl+Shift+P</kbd> to toggle
            </p>
          </div>
        </Card>
      )}
    </>
  )
}
