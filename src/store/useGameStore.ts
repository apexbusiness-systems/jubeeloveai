import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { logger } from '@/lib/logger'

type Theme = 'morning' | 'afternoon' | 'evening' | 'night'

interface GameState {
  currentTheme: Theme
  score: number
  stickers: string[]
  completedActivities: string[]
  updateTheme: (theme: Theme) => void
  addScore: (points: number) => void
  addSticker: (stickerId: string) => void
  markActivityComplete: (activityId: string) => void
  onActivityComplete?: () => void // Callback for achievement tracking
  setActivityCompleteCallback: (callback: () => void) => void
}

// Validator for game state integrity
export function isValidGameState(state: unknown): state is Partial<GameState> {
  if (typeof state !== 'object' || state === null) return false
  
  const s = state as Record<string, unknown>
  
  // Validate required fields
  if (s.currentTheme && !['morning', 'afternoon', 'evening', 'night'].includes(s.currentTheme as string)) {
    logger.warn('[GameStore] Invalid theme detected, will use default')
    return false
  }
  
  if (s.score !== undefined && (typeof s.score !== 'number' || !Number.isFinite(s.score))) {
    logger.warn('[GameStore] Invalid score detected, will reset')
    return false
  }
  
  if (s.stickers && !Array.isArray(s.stickers)) {
    logger.warn('[GameStore] Invalid stickers array detected')
    return false
  }
  
  if (s.completedActivities && !Array.isArray(s.completedActivities)) {
    logger.warn('[GameStore] Invalid completedActivities array detected')
    return false
  }
  
  return true
}

export const useGameStore = create<GameState>()(
  persist(
    immer((set, get) => ({
      currentTheme: 'morning',
      score: 0,
      stickers: [],
      completedActivities: [],
      onActivityComplete: undefined,
      updateTheme: (theme) => {
        // Guardrail: Only allow light themes for toddlers, never night mode
        const allowedThemes: Theme[] = ['morning', 'afternoon', 'evening'];
        const safeTheme = allowedThemes.includes(theme) ? theme : 'morning';
        
        // Additional validation
        if (!Number.isFinite(get().score)) {
          logger.error('[GameStore] Score corruption detected, resetting to 0')
          set((state) => { state.score = 0 })
        }
        
        set((state) => { state.currentTheme = safeTheme });
      },
      addScore: (points) => {
        // Guardrail: Validate points
        if (!Number.isFinite(points) || points < 0) {
          logger.warn(`[GameStore] Invalid points value: ${points}, ignoring`)
          return
        }
        
        set((state) => { 
          const newScore = state.score + points
          // Prevent score overflow
          state.score = Math.min(newScore, Number.MAX_SAFE_INTEGER)
        })
        const callback = get().onActivityComplete
        if (callback) callback()
      },
      addSticker: (stickerId) => set((state) => {
        // Guardrail: Validate sticker ID
        if (typeof stickerId !== 'string' || stickerId.length === 0) {
          logger.warn(`[GameStore] Invalid sticker ID: ${stickerId}`)
          return
        }
        
        if (!state.stickers.includes(stickerId)) {
          state.stickers.push(stickerId)
          
          // Guardrail: Prevent excessive sticker accumulation (memory leak)
          if (state.stickers.length > 1000) {
            logger.warn('[GameStore] Sticker array exceeded 1000 items, trimming oldest')
            state.stickers = state.stickers.slice(-1000)
          }
        }
      }),
      markActivityComplete: (activityId) => {
        // Guardrail: Validate activity ID
        if (typeof activityId !== 'string' || activityId.length === 0) {
          logger.warn(`[GameStore] Invalid activity ID: ${activityId}`)
          return
        }
        
        set((state) => {
          if (!state.completedActivities.includes(activityId)) {
            state.completedActivities.push(activityId)
            
            // Guardrail: Prevent excessive activity accumulation
            if (state.completedActivities.length > 10000) {
              logger.warn('[GameStore] Activity array exceeded 10000 items, trimming oldest')
              state.completedActivities = state.completedActivities.slice(-10000)
            }
          }
        })
        const callback = get().onActivityComplete
        if (callback) callback()
      },
      setActivityCompleteCallback: (callback) => set((state) => {
        state.onActivityComplete = callback
      })
    })),
    { 
      name: 'jubeelove-game-storage',
      version: 1, // Version for future migrations
      // Enhanced guardrails on rehydration
      onRehydrateStorage: () => (state) => {
        if (!state) return
        
        // Validate and fix theme
        if (state.currentTheme === 'night') {
          logger.warn('[GameStore] Night theme detected on rehydration, resetting to morning')
          state.currentTheme = 'morning'
        }
        
        // Validate score
        if (!Number.isFinite(state.score) || state.score < 0) {
          logger.warn('[GameStore] Invalid score on rehydration, resetting to 0')
          state.score = 0
        }
        
        // Validate arrays
        if (!Array.isArray(state.stickers)) {
          logger.warn('[GameStore] Invalid stickers array on rehydration, resetting')
          state.stickers = []
        }
        
        if (!Array.isArray(state.completedActivities)) {
          logger.warn('[GameStore] Invalid activities array on rehydration, resetting')
          state.completedActivities = []
        }
        
        // Trim excessive data if needed
        if (state.stickers.length > 1000) {
          logger.warn('[GameStore] Trimming stickers to last 1000 on rehydration')
          state.stickers = state.stickers.slice(-1000)
        }
        
        if (state.completedActivities.length > 10000) {
          logger.warn('[GameStore] Trimming activities to last 10000 on rehydration')
          state.completedActivities = state.completedActivities.slice(-10000)
        }
        
        logger.dev('[GameStore] State rehydrated and validated successfully')
      }
    }
  )
)
