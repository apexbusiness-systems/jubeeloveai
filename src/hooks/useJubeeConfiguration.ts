/**
 * Jubee Configuration Hook
 * 
 * Provides flexible configuration options for Jubee mascot behavior.
 * Includes accessibility options, debug mode, and feature flags.
 */

import { logger } from '@/lib/logger';
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface JubeeConfiguration {
  // Quality presets
  quality: 'low' | 'medium' | 'high' | 'auto'
  
  // Accessibility options
  reducedMotion: boolean
  highContrast: boolean
  noAnimations: boolean
  
  // Debug options
  debugMode: boolean
  showMetrics: boolean
  verboseLogging: boolean
  
  // Feature flags
  features: {
    collisionDetection: boolean
    draggable: boolean
    speechBubbles: boolean
    particles: boolean
    shadows: boolean
    autoRecovery: boolean
  }
  
  // Safe mode (minimal features, maximum stability)
  safeMode: boolean
  
  // Actions
  setQuality: (quality: 'low' | 'medium' | 'high' | 'auto') => void
  setReducedMotion: (enabled: boolean) => void
  setHighContrast: (enabled: boolean) => void
  setNoAnimations: (enabled: boolean) => void
  setDebugMode: (enabled: boolean) => void
  setShowMetrics: (enabled: boolean) => void
  setVerboseLogging: (enabled: boolean) => void
  toggleFeature: (feature: keyof JubeeConfiguration['features'], enabled: boolean) => void
  enableSafeMode: () => void
  disableSafeMode: () => void
  reset: () => void
}

const DEFAULT_CONFIG: Omit<JubeeConfiguration, 'setQuality' | 'setReducedMotion' | 'setHighContrast' | 'setNoAnimations' | 'setDebugMode' | 'setShowMetrics' | 'setVerboseLogging' | 'toggleFeature' | 'enableSafeMode' | 'disableSafeMode' | 'reset'> = {
  quality: 'auto',
  reducedMotion: false,
  highContrast: false,
  noAnimations: false,
  debugMode: false,
  showMetrics: false,
  verboseLogging: false,
  features: {
    collisionDetection: true,
    draggable: true,
    speechBubbles: true,
    particles: true,
    shadows: true,
    autoRecovery: true
  },
  safeMode: false
}

export const useJubeeConfiguration = create<JubeeConfiguration>()(
  persist(
    (set) => ({
      ...DEFAULT_CONFIG,
      
      setQuality: (quality) => set({ quality }),
      
      setReducedMotion: (enabled) => set({ reducedMotion: enabled }),
      
      setHighContrast: (enabled) => set({ highContrast: enabled }),
      
      setNoAnimations: (enabled) => set({ noAnimations: enabled }),
      
      setDebugMode: (enabled) => set({ debugMode: enabled }),
      
      setShowMetrics: (enabled) => set({ showMetrics: enabled }),
      
      setVerboseLogging: (enabled) => {
        set({ verboseLogging: enabled })
        if (enabled) {
          logger.dev('[Jubee Config] Verbose logging enabled')
        }
      },
      
      toggleFeature: (feature, enabled) => 
        set((state) => ({
          features: {
            ...state.features,
            [feature]: enabled
          }
        })),
      
      enableSafeMode: () => {
        logger.dev('[Jubee Config] Safe mode activated')
        set({
          safeMode: true,
          quality: 'low',
          features: {
            collisionDetection: false,
            draggable: false,
            speechBubbles: false,
            particles: false,
            shadows: false,
            autoRecovery: true // Keep recovery enabled
          }
        })
      },
      
      disableSafeMode: () => {
        logger.dev('[Jubee Config] Safe mode deactivated')
        set({
          safeMode: false,
          quality: 'auto',
          features: DEFAULT_CONFIG.features
        })
      },
      
      reset: () => {
        logger.dev('[Jubee Config] Configuration reset to defaults')
        set(DEFAULT_CONFIG)
      }
    }),
    {
      name: 'jubee-configuration',
      partialize: (state) => ({
        quality: state.quality,
        reducedMotion: state.reducedMotion,
        highContrast: state.highContrast,
        noAnimations: state.noAnimations,
        features: state.features,
        safeMode: state.safeMode
      })
    }
  )
)
