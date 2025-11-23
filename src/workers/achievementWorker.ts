/**
 * Achievement Calculation Web Worker
 * 
 * Offloads heavy achievement processing from main thread to prevent UI blocking.
 * Handles achievement evaluation, progress calculation, and unlock detection.
 */

import { Achievement } from '@/types/achievements'

export interface AchievementWorkerInput {
  type: 'CHECK_ACHIEVEMENTS'
  achievements: Achievement[]
  activityData: {
    activitiesCompleted: number
    currentStreak: number
    totalScore: number
    categoryCounts: Record<string, number>
    lastActivityDate?: string
  }
}

export interface AchievementWorkerOutput {
  type: 'ACHIEVEMENTS_CHECKED' | 'ERROR'
  newUnlocks: Achievement[]
  updatedAchievements: Achievement[]
  processingTime: number
  error?: string
}

// Worker message handler
self.onmessage = (event: MessageEvent<AchievementWorkerInput>) => {
  const startTime = performance.now()
  
  try {
    const { type, achievements, activityData } = event.data

    if (type === 'CHECK_ACHIEVEMENTS') {
      const result = processAchievements(achievements, activityData)
      
      const processingTime = performance.now() - startTime
      
      const output: AchievementWorkerOutput = {
        type: 'ACHIEVEMENTS_CHECKED',
        newUnlocks: result.newUnlocks,
        updatedAchievements: result.updatedAchievements,
        processingTime
      }

      self.postMessage(output)
    }
  } catch (error) {
    console.error('[AchievementWorker] Error processing achievements:', error)
    self.postMessage({
      type: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * Process achievements and detect new unlocks
 * This is the heavy computation that runs in the worker
 */
function processAchievements(
  achievements: Achievement[],
  activityData: AchievementWorkerInput['activityData']
) {
  const newUnlocks: Achievement[] = []
  const updatedAchievements: Achievement[] = []

  // Process each achievement
  for (const achievement of achievements) {
    // Skip already earned achievements
    if (achievement.earned) {
      updatedAchievements.push(achievement)
      continue
    }

    // Calculate progress based on achievement criteria
    const progress = calculateProgress(achievement, activityData)
    
    // Check if achievement should be unlocked
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

  return { newUnlocks, updatedAchievements }
}

/**
 * Calculate progress for a specific achievement
 * Complex logic that benefits from worker isolation
 */
function calculateProgress(
  achievement: Achievement,
  activityData: AchievementWorkerInput['activityData']
): number {
  const { category } = achievement

  switch (category) {
    case 'activity':
      // Activity-based achievements (e.g., complete 10 activities)
      return activityData.activitiesCompleted

    case 'streak':
      // Streak-based achievements (e.g., 7-day streak)
      return activityData.currentStreak

    case 'milestone':
      // Score milestone achievements (e.g., earn 1000 points)
      return activityData.totalScore

    case 'special': {
      // Special achievements with complex criteria
      if (achievement.id.includes('early_bird')) {
        // Check if last activity was before 9 AM
        if (activityData.lastActivityDate) {
          const lastDate = new Date(activityData.lastActivityDate)
          const hours = lastDate.getHours()
          return hours < 9 ? 1 : 0
        }
        return 0
      }

      if (achievement.id.includes('night_owl')) {
        // Check if last activity was after 9 PM
        if (activityData.lastActivityDate) {
          const lastDate = new Date(activityData.lastActivityDate)
          const hours = lastDate.getHours()
          return hours >= 21 ? 1 : 0
        }
        return 0
      }

      if (achievement.id.includes('perfect_score')) {
        // Check if user has perfect scores in all categories
        const categories = Object.values(activityData.categoryCounts)
        const perfectCount = categories.filter(count => count >= 10).length
        return perfectCount
      }

      // Default for unknown special achievements
      return 0
    }

    default:
      return 0
  }
}

// Export type for TypeScript support
export type AchievementWorkerType = typeof self
