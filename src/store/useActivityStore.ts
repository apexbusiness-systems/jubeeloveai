/**
 * User Activity Store
 * 
 * Persists user activity data across sessions including:
 * - Total time spent in app
 * - Last activity timestamps
 * - Pages visited
 * - Session count
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface ActivitySession {
  startTime: string
  endTime?: string
  duration: number // in seconds
  pagesVisited: string[]
}

interface ActivityState {
  // Session tracking
  totalSessions: number
  totalTimeSpent: number // in seconds
  currentSessionStart: string | null
  lastActivityTime: string | null
  
  // Page tracking
  pagesVisited: Record<string, number> // page path -> visit count
  favoritePages: string[] // top 3 most visited
  
  // Activity history (last 7 days)
  recentSessions: ActivitySession[]
  
  // Engagement metrics
  longestStreak: number
  averageSessionDuration: number
  
  // Actions
  startSession: () => void
  endSession: () => void
  recordPageVisit: (path: string) => void
  recordActivity: () => void
  getSessionStats: () => { duration: number; pagesVisited: number }
}

const MAX_RECENT_SESSIONS = 50
const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

export const useActivityStore = create<ActivityState>()(
  persist(
    immer((set, get) => ({
      totalSessions: 0,
      totalTimeSpent: 0,
      currentSessionStart: null,
      lastActivityTime: null,
      pagesVisited: {},
      favoritePages: [],
      recentSessions: [],
      longestStreak: 0,
      averageSessionDuration: 0,

      startSession: () => {
        const state = get()
        const now = new Date().toISOString()
        
        // Check if we should continue existing session or start new one
        const shouldStartNew = !state.currentSessionStart || 
          (state.lastActivityTime && 
           Date.now() - new Date(state.lastActivityTime).getTime() > SESSION_TIMEOUT_MS)
        
        if (shouldStartNew) {
          set((draft) => {
            draft.totalSessions += 1
            draft.currentSessionStart = now
            draft.lastActivityTime = now
          })
        } else {
          set((draft) => {
            draft.lastActivityTime = now
          })
        }
      },

      endSession: () => {
        const state = get()
        if (!state.currentSessionStart) return

        const startTime = new Date(state.currentSessionStart)
        const duration = Math.floor((Date.now() - startTime.getTime()) / 1000)

        set((draft) => {
          // Add to recent sessions
          const session: ActivitySession = {
            startTime: state.currentSessionStart!,
            endTime: new Date().toISOString(),
            duration,
            pagesVisited: Object.keys(state.pagesVisited).slice(0, 10)
          }
          
          draft.recentSessions.unshift(session)
          if (draft.recentSessions.length > MAX_RECENT_SESSIONS) {
            draft.recentSessions = draft.recentSessions.slice(0, MAX_RECENT_SESSIONS)
          }

          // Update totals
          draft.totalTimeSpent += duration
          
          // Update average
          if (draft.totalSessions > 0) {
            draft.averageSessionDuration = Math.floor(draft.totalTimeSpent / draft.totalSessions)
          }

          // Reset current session
          draft.currentSessionStart = null
        })
      },

      recordPageVisit: (path: string) => {
        const now = new Date().toISOString()
        
        set((draft) => {
          // Update page visit count
          draft.pagesVisited[path] = (draft.pagesVisited[path] || 0) + 1
          draft.lastActivityTime = now

          // Update favorite pages (top 3)
          const sorted = Object.entries(draft.pagesVisited)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([p]) => p)
          
          draft.favoritePages = sorted
        })
      },

      recordActivity: () => {
        set((draft) => {
          draft.lastActivityTime = new Date().toISOString()
        })
      },

      getSessionStats: () => {
        const state = get()
        if (!state.currentSessionStart) {
          return { duration: 0, pagesVisited: 0 }
        }

        const duration = Math.floor(
          (Date.now() - new Date(state.currentSessionStart).getTime()) / 1000
        )
        const pagesVisited = Object.keys(state.pagesVisited).length

        return { duration, pagesVisited }
      }
    })),
    {
      name: 'jubee-activity-store',
      version: 1,
      partialize: (state) => ({
        totalSessions: state.totalSessions,
        totalTimeSpent: state.totalTimeSpent,
        pagesVisited: state.pagesVisited,
        favoritePages: state.favoritePages,
        recentSessions: state.recentSessions,
        longestStreak: state.longestStreak,
        averageSessionDuration: state.averageSessionDuration,
        lastActivityTime: state.lastActivityTime
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('[Activity Store] Rehydration error:', error)
          return
        }
        
        if (state) {
          // Validate data on load
          if (typeof state.totalSessions !== 'number' || state.totalSessions < 0) {
            state.totalSessions = 0
          }
          if (typeof state.totalTimeSpent !== 'number' || state.totalTimeSpent < 0) {
            state.totalTimeSpent = 0
          }
          if (!state.pagesVisited || typeof state.pagesVisited !== 'object') {
            state.pagesVisited = {}
          }
          if (!Array.isArray(state.favoritePages)) {
            state.favoritePages = []
          }
          if (!Array.isArray(state.recentSessions)) {
            state.recentSessions = []
          }
        }
      }
    }
  )
)
