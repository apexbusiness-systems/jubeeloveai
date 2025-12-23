/**
 * Smart Jubee Greeting Hook
 * 
 * Provides contextual, time-aware, and activity-specific greetings
 * with anti-repetition logic and streak tracking.
 * Integrates with useAchievementStore for persistent streak data.
 * Persists greeting history to prevent repetition across sessions.
 */

import { useCallback, useMemo, useRef, useEffect } from 'react'
import { useJubeeStore } from '../store/useJubeeStore'
import { useAchievementStore } from '../store/useAchievementStore'
import {
  getContextualGreeting,
  getTimeOfDay,
  getActivityFromPath,
  type TimeOfDay,
  type Activity,
  type Mood,
  type GreetingContext
} from '../lib/jubeeGreetings'

interface UseJubeeGreetingOptions {
  childName?: string
  pathname?: string // Optional - defaults to '/' if not provided
}

interface GreetingResult {
  greeting: string
  timeOfDay: TimeOfDay
  activity: Activity
  mood: Mood
}

const GREETING_HISTORY_SIZE = 10
const FIRST_VISIT_KEY = 'jubee_last_visit_date'
const GREETING_HISTORY_KEY = 'jubee_greeting_history'
const VISIT_COUNT_KEY = 'jubee_total_visits'

/**
 * Load persisted greeting history
 */
function loadGreetingHistory(): string[] {
  try {
    const stored = localStorage.getItem(GREETING_HISTORY_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        return parsed.slice(0, GREETING_HISTORY_SIZE)
      }
    }
  } catch {
    // Ignore errors, return empty
  }
  return []
}

/**
 * Save greeting history to localStorage
 */
function saveGreetingHistory(history: string[]): void {
  try {
    localStorage.setItem(GREETING_HISTORY_KEY, JSON.stringify(history.slice(0, GREETING_HISTORY_SIZE)))
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check if this is the first visit of the day and track total visits
 */
function checkFirstVisitToday(): { isFirst: boolean; totalVisits: number } {
  try {
    const today = new Date().toDateString()
    const lastVisit = localStorage.getItem(FIRST_VISIT_KEY)
    const totalVisits = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10)
    
    if (lastVisit !== today) {
      localStorage.setItem(FIRST_VISIT_KEY, today)
      localStorage.setItem(VISIT_COUNT_KEY, String(totalVisits + 1))
      return { isFirst: true, totalVisits: totalVisits + 1 }
    }
    return { isFirst: false, totalVisits }
  } catch {
    return { isFirst: false, totalVisits: 0 }
  }
}

export function useJubeeGreeting(options: UseJubeeGreetingOptions = {}) {
  // Use provided pathname or default to home
  const pathname = options.pathname ?? '/'
  const { currentMood } = useJubeeStore()
  const { streakData, updateStreak } = useAchievementStore()
  const greetingHistory = useRef<string[]>(loadGreetingHistory())
  const visitInfo = useRef(checkFirstVisitToday())
  
  // Update streak on first visit today
  useEffect(() => {
    if (visitInfo.current.isFirst) {
      updateStreak()
    }
  }, [updateStreak])
  
  // Get current streak from persisted store
  const currentStreak = streakData?.currentStreak ?? 0
  
  // Memoize current context
  const context = useMemo((): GreetingContext => ({
    timeOfDay: getTimeOfDay(),
    activity: getActivityFromPath(pathname),
    mood: currentMood,
    childName: options.childName,
    isFirstVisitToday: visitInfo.current.isFirst,
    streak: currentStreak
  }), [pathname, currentMood, options.childName, currentStreak])
  
  /**
   * Get a contextual greeting, avoiding recent repeats
   */
  const getGreeting = useCallback((forceMood?: Mood): GreetingResult => {
    const ctx: GreetingContext = {
      ...context,
      mood: forceMood || context.mood
    }
    
    // Try up to 3 times to get a non-repeated greeting
    let greeting: string
    let attempts = 0
    do {
      greeting = getContextualGreeting(ctx)
      attempts++
    } while (
      greetingHistory.current.includes(greeting) && 
      attempts < 3
    )
    
    // Update history (keep last N greetings) and persist
    greetingHistory.current.push(greeting)
    if (greetingHistory.current.length > GREETING_HISTORY_SIZE) {
      greetingHistory.current.shift()
    }
    saveGreetingHistory(greetingHistory.current)
    
    // Mark first visit as consumed
    if (visitInfo.current.isFirst) {
      visitInfo.current = { ...visitInfo.current, isFirst: false }
    }
    
    return {
      greeting,
      timeOfDay: ctx.timeOfDay,
      activity: ctx.activity,
      mood: ctx.mood || 'happy'
    }
  }, [context])
  
  /**
   * Get greeting for a specific activity (for navigation)
   */
  const getActivityGreeting = useCallback((activity: Activity): string => {
    const ctx: GreetingContext = {
      ...context,
      activity
    }
    return getContextualGreeting(ctx)
  }, [context])
  
  /**
   * Get a time-appropriate greeting
   */
  const getTimeGreeting = useCallback((): string => {
    return getContextualGreeting({
      ...context,
      activity: 'home' // Neutral activity for time-based
    })
  }, [context])
  
  /**
   * Get encouragement based on current mood
   */
  const getEncouragement = useCallback((): string => {
    const encouragements: Record<Mood, string[]> = {
      happy: [
        "You're doing great! Keep going! ✨",
        "Amazing work! *happy buzz* 🐝",
        "You're a superstar! 🌟"
      ],
      excited: [
        "Wow, you're on fire! 🔥",
        "So awesome! Keep that energy! ⚡",
        "You're unstoppable! 🚀"
      ],
      frustrated: [
        "It's okay, let's take a break. 💙",
        "You're doing your best! That's amazing! 💪",
        "Deep breath... you've got this! 🌸"
      ],
      curious: [
        "Great question! Let's find out! 🔍",
        "Ooh, I wonder too! 💡",
        "Curiosity is a superpower! 🧠"
      ],
      tired: [
        "You worked so hard today! 🌙",
        "Rest is important too! ☁️",
        "Sweet dreams, little friend! 💤"
      ]
    }
    
    const mood = currentMood || 'happy'
    const options = encouragements[mood]
    return options[Math.floor(Math.random() * options.length)]
  }, [currentMood])
  
  return {
    getGreeting,
    getActivityGreeting,
    getTimeGreeting,
    getEncouragement,
    currentTimeOfDay: context.timeOfDay,
    currentActivity: context.activity,
    currentMood: context.mood
  }
}
