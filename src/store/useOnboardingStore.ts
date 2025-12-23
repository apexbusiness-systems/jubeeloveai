import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface OnboardingState {
  hasCompletedOnboarding: boolean
  currentStep: number
  isActive: boolean
  // Enhanced persistence data
  completedAt: string | null
  skippedAt: string | null
  highestStepReached: number
  completedSteps: number[]
  onboardingVersion: number // Track version for future updates
  
  startOnboarding: () => void
  completeOnboarding: () => void
  nextStep: () => void
  previousStep: () => void
  skipOnboarding: () => void
  setStep: (step: number) => void
  resetOnboarding: () => void
}

const CURRENT_ONBOARDING_VERSION = 1

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    immer((set) => ({
      hasCompletedOnboarding: false,
      currentStep: 0,
      isActive: false,
      completedAt: null,
      skippedAt: null,
      highestStepReached: 0,
      completedSteps: [],
      onboardingVersion: CURRENT_ONBOARDING_VERSION,

      startOnboarding: () => set((state) => {
        state.isActive = true
        state.currentStep = 0
        state.skippedAt = null
      }),
      
      completeOnboarding: () => set((state) => {
        state.hasCompletedOnboarding = true
        state.isActive = false
        state.completedAt = new Date().toISOString()
        if (!state.completedSteps.includes(state.currentStep)) {
          state.completedSteps.push(state.currentStep)
        }
      }),
      
      nextStep: () => set((state) => {
        const nextStep = state.currentStep + 1
        if (!state.completedSteps.includes(state.currentStep)) {
          state.completedSteps.push(state.currentStep)
        }
        state.currentStep = nextStep
        state.highestStepReached = Math.max(state.highestStepReached, nextStep)
      }),
      
      previousStep: () => set((state) => {
        state.currentStep = Math.max(0, state.currentStep - 1)
      }),
      
      skipOnboarding: () => set((state) => {
        state.hasCompletedOnboarding = true
        state.isActive = false
        state.skippedAt = new Date().toISOString()
      }),
      
      setStep: (step: number) => set((state) => {
        state.currentStep = step
        state.highestStepReached = Math.max(state.highestStepReached, step)
      }),

      resetOnboarding: () => set((state) => {
        state.hasCompletedOnboarding = false
        state.currentStep = 0
        state.isActive = false
        state.completedAt = null
        state.skippedAt = null
        state.highestStepReached = 0
        state.completedSteps = []
      }),
    })),
    {
      name: 'jubee-onboarding-storage',
      version: 1,
      partialize: (state) => ({ 
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        completedAt: state.completedAt,
        skippedAt: state.skippedAt,
        highestStepReached: state.highestStepReached,
        completedSteps: state.completedSteps,
        onboardingVersion: state.onboardingVersion
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('[Onboarding Store] Rehydration error:', error)
          return
        }
        
        if (state) {
          // Validate data
          if (typeof state.hasCompletedOnboarding !== 'boolean') {
            state.hasCompletedOnboarding = false
          }
          if (typeof state.highestStepReached !== 'number' || state.highestStepReached < 0) {
            state.highestStepReached = 0
          }
          if (!Array.isArray(state.completedSteps)) {
            state.completedSteps = []
          }
          
          // Check if onboarding version changed (might need to re-show new features)
          if (state.onboardingVersion !== CURRENT_ONBOARDING_VERSION) {
            // Could trigger re-onboarding for new features
            state.onboardingVersion = CURRENT_ONBOARDING_VERSION
          }
        }
      }
    }
  )
)
