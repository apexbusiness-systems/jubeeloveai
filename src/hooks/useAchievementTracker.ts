import { logger } from '@/lib/logger';
import { useEffect, useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '@/store/useGameStore'
import { useAchievementStore } from '@/store/useAchievementStore'
import { useJubeeStore } from '@/store/useJubeeStore'
import { toast } from '@/hooks/use-toast'
import { useAchievementWorker } from './useAchievementWorker'

export function useAchievementTracker() {
  // ⚡ Bolt Optimization: Grouped Zustand selectors with useShallow to reduce store subscriptions
  const { score, completedActivities } = useGameStore(useShallow(state => ({
    score: state.score,
    completedActivities: state.completedActivities
  })));

  const {
    initializeAchievements,
    checkAndUnlockAchievements,
    updateStreak,
    trackSpecialAchievement,
    achievements,
    streakData
  } = useAchievementStore(useShallow(state => ({
    initializeAchievements: state.initializeAchievements,
    checkAndUnlockAchievements: state.checkAndUnlockAchievements,
    updateStreak: state.updateStreak,
    trackSpecialAchievement: state.trackSpecialAchievement,
    achievements: state.achievements,
    streakData: state.streakData
  })));

  const speak = useJubeeStore(state => state.speak);

  // Initialize Web Worker for achievement calculations
  const { processAchievements, isWorkerSupported } = useAchievementWorker({
    onAchievementsProcessed: (data) => {
      // Show notifications for newly unlocked achievements
      data.newUnlocks.forEach(achievement => {
        toast({
          title: `🎉 Achievement Unlocked!`,
          description: `${achievement.emoji} ${achievement.name}: ${achievement.description}`,
          duration: 5000
        })

        speak(`Amazing! You unlocked ${achievement.name}!`)
      })

      logger.dev(`[AchievementTracker] Web Worker processed achievements in ${data.processingTime.toFixed(2)}ms`)
    },
    onError: (error) => {
      console.error('[AchievementTracker] Worker error:', error)
      // Fallback to main thread already handled by useAchievementWorker
    }
  })

  // Initialize achievements on first load
  useEffect(() => {
    initializeAchievements()
  }, [initializeAchievements])

  // Check for new achievements using Web Worker
  const checkAchievements = useCallback(async () => {
    if (isWorkerSupported) {
      // Process in Web Worker (offloaded from main thread)
      await processAchievements(achievements, {
        activitiesCompleted: completedActivities.length,
        currentStreak: streakData.currentStreak,
        totalScore: score,
        categoryCounts: {}, // TODO: Track category-specific counts if needed
        lastActivityDate: new Date().toISOString()
      })
    } else {
      // Fallback to original sync processing
      const newAchievements = checkAndUnlockAchievements({
        score,
        completedActivities
      })

      // Show notifications for newly unlocked achievements
      newAchievements.forEach(achievement => {
        toast({
          title: `🎉 Achievement Unlocked!`,
          description: `${achievement.emoji} ${achievement.name}: ${achievement.description}`,
          duration: 5000
        })

        speak(`Amazing! You unlocked ${achievement.name}!`)
      })
    }
  }, [
    isWorkerSupported,
    processAchievements,
    achievements,
    completedActivities,
    streakData.currentStreak,
    score,
    checkAndUnlockAchievements,
    speak
  ])

  // Track activity completion for streaks
  const trackActivity = useCallback(() => {
    updateStreak()
    
    // Check for time-based special achievements
    const hour = new Date().getHours()
    if (hour < 9) {
      trackSpecialAchievement('earlyBird')
    } else if (hour >= 20) {
      trackSpecialAchievement('nightOwl')
    }

    // Check for new achievements after tracking
    checkAchievements()
  }, [updateStreak, trackSpecialAchievement, checkAchievements])

  // Track perfect score achievements
  const trackPerfectScore = useCallback(() => {
    trackSpecialAchievement('perfectScore')
    checkAchievements()
  }, [trackSpecialAchievement, checkAchievements])

  return {
    trackActivity,
    trackPerfectScore,
    checkAchievements,
    achievements
  }
}
