/**
 * Achievement Worker Hook
 * 
 * Manages Web Worker lifecycle and communication for achievement calculations.
 * Provides fallback to main thread processing if Worker API unavailable.
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { Achievement } from '@/types/achievements'
import type { AchievementWorkerInput, AchievementWorkerOutput } from '@/workers/achievementWorker'

interface UseAchievementWorkerOptions {
  onAchievementsProcessed?: (data: AchievementWorkerOutput) => void
  onError?: (error: Error) => void
}

export function useAchievementWorker(options: UseAchievementWorkerOptions = {}) {
  const workerRef = useRef<Worker | null>(null)
  const [isWorkerSupported, setIsWorkerSupported] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  // Initialize worker on mount
  useEffect(() => {
    // Check if Worker API is supported
    if (typeof Worker === 'undefined') {
      console.warn('[AchievementWorker] Web Workers not supported, using fallback')
      setIsWorkerSupported(false)
      return
    }

    try {
      // Create worker instance
      workerRef.current = new Worker(
        new URL('../workers/achievementWorker.ts', import.meta.url),
        { type: 'module' }
      )

      // Set up message handler
      workerRef.current.onmessage = (event: MessageEvent<AchievementWorkerOutput>) => {
        setIsProcessing(false)
        
        if (event.data.type === 'ACHIEVEMENTS_CHECKED') {
          console.log(
            `[AchievementWorker] Processed in ${event.data.processingTime.toFixed(2)}ms`,
            `Found ${event.data.newUnlocks.length} new unlocks`
          )
          options.onAchievementsProcessed?.(event.data)
        } else if (event.data.type === 'ERROR' && event.data.error) {
          const error = new Error(event.data.error)
          console.error('[AchievementWorker] Worker error:', error)
          options.onError?.(error)
        }
      }

      // Set up error handler
      workerRef.current.onerror = (error) => {
        setIsProcessing(false)
        console.error('[AchievementWorker] Worker error:', error)
        options.onError?.(new Error(error.message))
      }

      console.log('[AchievementWorker] Worker initialized successfully')
    } catch (error) {
      console.error('[AchievementWorker] Failed to initialize worker:', error)
      setIsWorkerSupported(false)
    }

    // Cleanup on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
        console.log('[AchievementWorker] Worker terminated')
      }
    }
  }, [options.onAchievementsProcessed, options.onError])

  /**
   * Process achievements in worker
   * Falls back to main thread if worker unavailable
   */
  const processAchievements = useCallback(
    async (
      achievements: Achievement[],
      activityData: AchievementWorkerInput['activityData']
    ): Promise<AchievementWorkerOutput | null> => {
      if (isProcessing) {
        console.warn('[AchievementWorker] Already processing, skipping request')
        return null
      }

      setIsProcessing(true)

      // Fallback to main thread processing if worker unavailable
      if (!isWorkerSupported || !workerRef.current) {
        console.log('[AchievementWorker] Using main thread fallback')
        
        try {
          const result = await processAchievementsMainThread(achievements, activityData)
          setIsProcessing(false)
          return result
        } catch (error) {
          setIsProcessing(false)
          const err = error instanceof Error ? error : new Error('Unknown error')
          options.onError?.(err)
          return null
        }
      }

      // Process in worker
      return new Promise((resolve) => {
        const handler = (event: MessageEvent<AchievementWorkerOutput>) => {
          if (workerRef.current) {
            workerRef.current.removeEventListener('message', handler)
          }
          resolve(event.data)
        }

        workerRef.current!.addEventListener('message', handler)

        const input: AchievementWorkerInput = {
          type: 'CHECK_ACHIEVEMENTS',
          achievements,
          activityData
        }

        workerRef.current!.postMessage(input)
      })
    },
    [isWorkerSupported, isProcessing, options]
  )

  /**
   * Terminate worker manually if needed
   */
  const terminateWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
      console.log('[AchievementWorker] Worker manually terminated')
    }
  }, [])

  return {
    processAchievements,
    terminateWorker,
    isWorkerSupported,
    isProcessing
  }
}

/**
 * Fallback: Process achievements on main thread
 * Used when Web Workers are not supported
 */
async function processAchievementsMainThread(
  achievements: Achievement[],
  activityData: AchievementWorkerInput['activityData']
): Promise<AchievementWorkerOutput> {
  const startTime = performance.now()

  // Simulate worker processing
  await new Promise(resolve => setTimeout(resolve, 0))

  const newUnlocks: Achievement[] = []
  const updatedAchievements: Achievement[] = []

  for (const achievement of achievements) {
    if (achievement.earned) {
      updatedAchievements.push(achievement)
      continue
    }

    const progress = calculateProgressMainThread(achievement, activityData)
    const shouldUnlock = progress >= achievement.requirement

    const updated: Achievement = {
      ...achievement,
      progress,
      earned: shouldUnlock,
      earnedAt: shouldUnlock ? new Date() : undefined
    }

    updatedAchievements.push(updated)

    if (shouldUnlock && !achievement.earned) {
      newUnlocks.push(updated)
    }
  }

  const processingTime = performance.now() - startTime

  return {
    type: 'ACHIEVEMENTS_CHECKED',
    newUnlocks,
    updatedAchievements,
    processingTime
  }
}

function calculateProgressMainThread(
  achievement: Achievement,
  activityData: AchievementWorkerInput['activityData']
): number {
  const { category } = achievement

  switch (category) {
    case 'activity':
      return activityData.activitiesCompleted
    case 'streak':
      return activityData.currentStreak
    case 'milestone':
      return activityData.totalScore
    case 'special': {
      if (achievement.id.includes('early_bird')) {
        if (activityData.lastActivityDate) {
          const hours = new Date(activityData.lastActivityDate).getHours()
          return hours < 9 ? 1 : 0
        }
        return 0
      }
      if (achievement.id.includes('night_owl')) {
        if (activityData.lastActivityDate) {
          const hours = new Date(activityData.lastActivityDate).getHours()
          return hours >= 21 ? 1 : 0
        }
        return 0
      }
      if (achievement.id.includes('perfect_score')) {
        const categories = Object.values(activityData.categoryCounts)
        return categories.filter(count => count >= 10).length
      }
      return 0
    }
    default:
      return 0
  }
}
