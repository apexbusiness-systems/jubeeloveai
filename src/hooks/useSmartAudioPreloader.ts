import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { audioManager } from '@/lib/audioManager'
import { useJubeeStore } from '@/store/useJubeeStore'

/**
 * Smart Audio Preloader
 * Predicts and caches likely phrases based on navigation patterns and context
 */

interface PreloadContext {
  route: string
  lastActivity: string
  timestamp: number
}

export function useSmartAudioPreloader() {
  const location = useLocation()
  const { voice } = useJubeeStore()
  const contextHistory = useRef<PreloadContext[]>([])
  const preloadedRoutes = useRef<Set<string>>(new Set())

  // Common feedback phrases by context
  const commonPhrases = {
    game: [
      { text: "Great job!", mood: 'happy', priority: 'high' as const },
      { text: "You're doing amazing!", mood: 'excited', priority: 'high' as const },
      { text: "That's correct!", mood: 'happy', priority: 'high' as const },
      { text: "Let's try again!", mood: 'curious', priority: 'high' as const },
      { text: "Keep going!", mood: 'happy', priority: 'low' as const },
      { text: "Well done!", mood: 'happy', priority: 'low' as const },
      { text: "Fantastic!", mood: 'excited', priority: 'low' as const },
      { text: "Try one more time!", mood: 'curious', priority: 'low' as const },
    ],
    story: [
      { text: "Would you like to hear the story?", mood: 'curious', priority: 'high' as const },
      { text: "Great job reading the story! You earned 50 points!", mood: 'excited', priority: 'high' as const },
      { text: "Let's turn the page!", mood: 'happy', priority: 'low' as const },
    ],
    general: [
      { text: "Hello! I'm Jubee!", mood: 'happy', priority: 'low' as const },
      { text: "What would you like to do today?", mood: 'curious', priority: 'low' as const },
    ]
  }

  // Preload story pages when story is in context
  const preloadStoryPages = (storyPages: Array<{ narration: string }>) => {
    const phrases = storyPages.slice(0, 3).map(page => ({
      text: page.narration,
      voice,
      mood: 'happy' as const,
      priority: 'high' as const
    }))

    audioManager.batchPreload(phrases)
  }

  // Detect context and preload relevant phrases
  useEffect(() => {
    const route = location.pathname
    
    // Skip if already preloaded for this route
    if (preloadedRoutes.current.has(route)) {
      return
    }

    // Add to context history
    contextHistory.current.push({
      route,
      lastActivity: route,
      timestamp: Date.now()
    })

    // Keep only last 10 entries
    if (contextHistory.current.length > 10) {
      contextHistory.current = contextHistory.current.slice(-10)
    }

    // Determine context and preload
    const preloadForRoute = async () => {
      let phrasesToPreload: typeof commonPhrases.game = []

      // Game routes - preload game feedback
      if (route.includes('/alphabet') || route.includes('/numbers') || 
          route.includes('/colors') || route.includes('/shapes') ||
          route.includes('/memory') || route.includes('/pattern') || 
          route.includes('/puzzle')) {
        phrasesToPreload = commonPhrases.game
      }
      // Story route - preload story phrases
      else if (route.includes('/story')) {
        phrasesToPreload = commonPhrases.story
      }
      // Home or other routes
      else {
        phrasesToPreload = commonPhrases.general
      }

      // Add voice parameter and preload
      const phrasesWithVoice = phrasesToPreload.map(p => ({
        ...p,
        voice
      }))

      await audioManager.batchPreload(phrasesWithVoice)
      preloadedRoutes.current.add(route)
    }

    // Use idle callback to avoid blocking UI
    const extendedWindow = window as Window &
      typeof globalThis & { requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number };

    if (extendedWindow.requestIdleCallback) {
      extendedWindow.requestIdleCallback(preloadForRoute, { timeout: 3000 })
    } else {
      setTimeout(preloadForRoute, 500)
    }

  }, [location.pathname, voice])

  // Expose method for manual preloading (e.g., when story is selected)
  const preloadStoryContext = (storyPages: Array<{ narration: string }>) => {
    preloadStoryPages(storyPages)
  }

  return {
    preloadStoryContext
  }
}
