import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

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
}

export const useGameStore = create<GameState>()(
  persist(
    immer((set) => ({
      currentTheme: 'morning',
      score: 0,
      stickers: [],
      completedActivities: [],
      updateTheme: (theme) => set((state) => { state.currentTheme = theme }),
      addScore: (points) => set((state) => { state.score += points }),
      addSticker: (stickerId) => set((state) => {
        if (!state.stickers.includes(stickerId)) {
          state.stickers.push(stickerId)
        }
      }),
      markActivityComplete: (activityId) => set((state) => {
        if (!state.completedActivities.includes(activityId)) {
          state.completedActivities.push(activityId)
        }
      })
    })),
    { name: 'jubeelove-game-storage' }
  )
)
