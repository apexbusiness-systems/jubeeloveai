import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { Achievement } from '@/types/achievements'
import { achievementDefinitions } from '@/config/achievements'

interface StreakData {
  currentStreak: number
  longestStreak: number
  lastActivityDate: string | null
}

interface AchievementState {
  achievements: Achievement[]
  streakData: StreakData
  specialAchievements: {
    earlyBirdCount: number
    nightOwlCount: number
    perfectScoreCount: number
  }
  
  // Actions
  initializeAchievements: () => void
  checkAndUnlockAchievements: (gameState: {
    score: number
    completedActivities: string[]
  }) => Achievement[]
  updateStreak: () => void
  unlockAchievement: (achievementId: string) => void
  trackSpecialAchievement: (type: 'earlyBird' | 'nightOwl' | 'perfectScore') => void
  getProgress: (achievementId: string) => number
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    immer((set, get) => ({
      achievements: [],
      streakData: {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null
      },
      specialAchievements: {
        earlyBirdCount: 0,
        nightOwlCount: 0,
        perfectScoreCount: 0
      },

      initializeAchievements: () => {
        const existingAchievements = get().achievements
        
        if (existingAchievements.length === 0) {
          const initialAchievements: Achievement[] = achievementDefinitions.map(def => ({
            id: def.id,
            name: def.name,
            description: def.description,
            emoji: def.emoji,
            category: def.category,
            requirement: def.requirement,
            earned: false,
            progress: 0
          }))
          
          set((state) => {
            state.achievements = initialAchievements
          })
        }
      },

      checkAndUnlockAchievements: (gameState) => {
        const newlyUnlocked: Achievement[] = []
        const { currentStreak } = get().streakData
        const { earlyBirdCount, nightOwlCount, perfectScoreCount } = get().specialAchievements
        
        const checkState = {
          score: gameState.score,
          completedActivities: gameState.completedActivities,
          currentStreak,
          totalActivitiesCompleted: gameState.completedActivities.length
        }

        set((state) => {
          achievementDefinitions.forEach(def => {
            const achievement = state.achievements.find(a => a.id === def.id)
            
            if (achievement && !achievement.earned) {
              let shouldUnlock = false
              let progress = 0

              // Check regular conditions
              if (def.category !== 'special') {
                shouldUnlock = def.checkCondition(checkState)
                
                // Calculate progress
                switch (def.category) {
                  case 'activity':
                    progress = Math.min((checkState.totalActivitiesCompleted / def.requirement) * 100, 100)
                    break
                  case 'streak':
                    progress = Math.min((checkState.currentStreak / def.requirement) * 100, 100)
                    break
                  case 'milestone':
                    progress = Math.min((checkState.score / def.requirement) * 100, 100)
                    break
                }
              } else {
                // Handle special achievements
                switch (def.id) {
                  case 'early_bird':
                    shouldUnlock = earlyBirdCount >= def.requirement
                    progress = Math.min((earlyBirdCount / def.requirement) * 100, 100)
                    break
                  case 'night_owl':
                    shouldUnlock = nightOwlCount >= def.requirement
                    progress = Math.min((nightOwlCount / def.requirement) * 100, 100)
                    break
                  case 'perfectionist':
                    shouldUnlock = perfectScoreCount >= def.requirement
                    progress = Math.min((perfectScoreCount / def.requirement) * 100, 100)
                    break
                }
              }

              achievement.progress = progress

              if (shouldUnlock) {
                achievement.earned = true
                achievement.earnedAt = new Date()
                newlyUnlocked.push({ ...achievement })
              }
            }
          })
        })

        return newlyUnlocked
      },

      updateStreak: () => {
        const today = new Date().toDateString()
        const { lastActivityDate, longestStreak } = get().streakData

        set((state) => {
          if (!lastActivityDate) {
            // First activity ever
            state.streakData.currentStreak = 1
            state.streakData.lastActivityDate = today
            state.streakData.longestStreak = 1
          } else {
            const lastDate = new Date(lastActivityDate)
            const todayDate = new Date(today)
            const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

            if (diffDays === 0) {
              // Same day, don't update streak
              return
            } else if (diffDays === 1) {
              // Consecutive day
              state.streakData.currentStreak += 1
              state.streakData.lastActivityDate = today
              
              if (state.streakData.currentStreak > longestStreak) {
                state.streakData.longestStreak = state.streakData.currentStreak
              }
            } else {
              // Streak broken
              state.streakData.currentStreak = 1
              state.streakData.lastActivityDate = today
            }
          }
        })
      },

      unlockAchievement: (achievementId) => {
        set((state) => {
          const achievement = state.achievements.find(a => a.id === achievementId)
          if (achievement && !achievement.earned) {
            achievement.earned = true
            achievement.earnedAt = new Date()
            achievement.progress = 100
          }
        })
      },

      trackSpecialAchievement: (type) => {
        set((state) => {
          switch (type) {
            case 'earlyBird':
              state.specialAchievements.earlyBirdCount += 1
              break
            case 'nightOwl':
              state.specialAchievements.nightOwlCount += 1
              break
            case 'perfectScore':
              state.specialAchievements.perfectScoreCount += 1
              break
          }
        })
      },

      getProgress: (achievementId) => {
        const achievement = get().achievements.find(a => a.id === achievementId)
        return achievement?.progress || 0
      }
    })),
    { name: 'jubeelove-achievement-storage' }
  )
)
