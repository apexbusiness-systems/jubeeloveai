/**
 * Jubee Performance Optimization Hook
 * 
 * Optimizes rendering performance through throttling, LOD, and adaptive quality.
 * Ensures smooth experience across all devices.
 */

import { useEffect, useRef, useState } from 'react'

interface PerformanceProfile {
  quality: 'low' | 'medium' | 'high'
  targetFPS: number
  shadowsEnabled: boolean
  particlesEnabled: boolean
  geometrySegments: number
  animationThrottle: number
}

const PERFORMANCE_PROFILES: Record<string, PerformanceProfile> = {
  low: {
    quality: 'low',
    targetFPS: 30,
    shadowsEnabled: false,
    particlesEnabled: false,
    geometrySegments: 16,
    animationThrottle: 100
  },
  medium: {
    quality: 'medium',
    targetFPS: 45,
    shadowsEnabled: true,
    particlesEnabled: true,
    geometrySegments: 32,
    animationThrottle: 50
  },
  high: {
    quality: 'high',
    targetFPS: 60,
    shadowsEnabled: true,
    particlesEnabled: true,
    geometrySegments: 64,
    animationThrottle: 16
  }
}

const FPS_SAMPLE_SIZE = 30
const PERFORMANCE_CHECK_INTERVAL = 5000
const FPS_THRESHOLD_DOWNGRADE = 25 // Drop quality if below this
const FPS_THRESHOLD_UPGRADE = 55 // Increase quality if above this

export function useJubeePerformance() {
  const [profile, setProfile] = useState<PerformanceProfile>(PERFORMANCE_PROFILES.medium)
  const fpsHistoryRef = useRef<number[]>([])
  const lastFrameTimeRef = useRef(performance.now())
  const frameCountRef = useRef(0)

  // Measure FPS
  const measureFPS = (): number => {
    const now = performance.now()
    const delta = now - lastFrameTimeRef.current
    lastFrameTimeRef.current = now

    if (delta === 0) return 60

    const fps = 1000 / delta
    
    // Add to history
    fpsHistoryRef.current.push(fps)
    if (fpsHistoryRef.current.length > FPS_SAMPLE_SIZE) {
      fpsHistoryRef.current.shift()
    }

    frameCountRef.current++

    return fps
  }

  // Calculate average FPS
  const getAverageFPS = (): number => {
    if (fpsHistoryRef.current.length === 0) return 60

    const sum = fpsHistoryRef.current.reduce((a, b) => a + b, 0)
    return sum / fpsHistoryRef.current.length
  }

  // Adaptive quality adjustment
  const adjustQuality = () => {
    const avgFPS = getAverageFPS()

    if (avgFPS < FPS_THRESHOLD_DOWNGRADE && profile.quality !== 'low') {
      console.log('[Performance] Downgrading quality due to low FPS:', avgFPS)
      
      if (profile.quality === 'high') {
        setProfile(PERFORMANCE_PROFILES.medium)
      } else if (profile.quality === 'medium') {
        setProfile(PERFORMANCE_PROFILES.low)
      }
    } else if (avgFPS > FPS_THRESHOLD_UPGRADE && profile.quality !== 'high') {
      console.log('[Performance] Upgrading quality due to high FPS:', avgFPS)
      
      if (profile.quality === 'low') {
        setProfile(PERFORMANCE_PROFILES.medium)
      } else if (profile.quality === 'medium') {
        setProfile(PERFORMANCE_PROFILES.high)
      }
    }
  }

  // Manual quality override
  const setQuality = (quality: 'low' | 'medium' | 'high') => {
    console.log('[Performance] Manual quality override:', quality)
    setProfile(PERFORMANCE_PROFILES[quality])
  }

  // Throttled animation update
  const shouldUpdateAnimation = (lastUpdateTime: number): boolean => {
    const elapsed = performance.now() - lastUpdateTime
    return elapsed >= profile.animationThrottle
  }

  // Periodic performance monitoring
  useEffect(() => {
    const intervalId = setInterval(() => {
      adjustQuality()

      // Log performance metrics
      const avgFPS = getAverageFPS()
      console.log('[Performance] Current FPS:', avgFPS.toFixed(1), 'Profile:', profile.quality)
    }, PERFORMANCE_CHECK_INTERVAL)

    return () => clearInterval(intervalId)
  }, [profile, adjustQuality])

  return {
    profile,
    measureFPS,
    getAverageFPS,
    setQuality,
    shouldUpdateAnimation,
    frameCount: frameCountRef.current
  }
}
