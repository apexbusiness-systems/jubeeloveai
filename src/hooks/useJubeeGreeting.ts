/**
 * Smart Jubee Greeting Hook
 * 
 * Provides contextual, time-aware, and activity-specific greetings
 * with anti-repetition logic and streak tracking.
 */

import { useCallback, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useJubeeStore } from '../store/useJubeeStore'
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
  streak?: number
}

interface GreetingResult {
  greeting: string
  timeOfDay: TimeOfDay
  activity: Activity
  mood: Mood
}

const GREETING_HISTORY_SIZE = 5
const FIRST_VISIT_KEY = 'jubee_last_visit_date'

/**
 * Check if this is the first visit of the day
 */
function checkFirstVisitToday(): boolean {
  try {
    const today = new Date().toDateString()
    const lastVisit = localStorage.getItem(FIRST_VISIT_KEY)
    
    if (lastVisit !== today) {
      localStorage.setItem(FIRST_VISIT_KEY, today)
      return true
    }
    return false
  } catch {
    return false
  }
}

export function useJubeeGreeting(options: UseJubeeGreetingOptions = {}) {
  const location = useLocation()
  const { currentMood } = useJubeeStore()
  const greetingHistory = useRef<string[]>([])
  const isFirstVisitToday = useRef(checkFirstVisitToday())
  
  // Memoize current context
  const context = useMemo((): GreetingContext => ({
    timeOfDay: getTimeOfDay(),
    activity: getActivityFromPath(location.pathname),
    mood: currentMood,
    childName: options.childName,
    isFirstVisitToday: isFirstVisitToday.current,
    streak: options.streak
  }), [location.pathname, currentMood, options.childName, options.streak])
  
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
    
    // Update history (keep last N greetings)
    greetingHistory.current.push(greeting)
    if (greetingHistory.current.length > GREETING_HISTORY_SIZE) {
      greetingHistory.current.shift()
    }
    
    // Mark first visit as consumed
    if (isFirstVisitToday.current) {
      isFirstVisitToday.current = false
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
