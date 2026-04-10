import { useEffect, useCallback } from 'react'
import { useGameStore } from '@/store/useGameStore'
import { useAchievementStore } from '@/store/useAchievementStore'
import { useJubeeStore } from '@/store/useJubeeStore'
import { toast } from '@/hooks/use-toast'
import { useAchievementWorker } from './useAchievementWorker'

export function useAchievementTracker() {
  const score = useGameStore(state => state.score);
const completedActivities = useGameStore(state => state.completedActivities);
  const initializeAchievements = useAchievementStore(state => state.initializeAchievements);
const checkAndUnlockAchievements = useAchievementStore(state => state.checkAndUnlockAchievements);
const updateStreak = useAchievementStore(state => state.updateStreak);
const trackSpecialAchievement = useAchievementStore(state => state.trackSpecialAchievement);
const achievements = useAchievementStore(state => state.achievements);
const streakData = useAchievementStore(state => state.streakData);
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

      console.log(`[AchievementTracker] Web Worker processed achievements in ${data.processingTime.toFixed(2)}ms`)
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
