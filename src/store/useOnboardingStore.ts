import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OnboardingState {
  hasCompletedOnboarding: boolean
  currentStep: number
  isActive: boolean
  startOnboarding: () => void
  completeOnboarding: () => void
  nextStep: () => void
  previousStep: () => void
  skipOnboarding: () => void
  setStep: (step: number) => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: true,
      currentStep: 0,
      isActive: false,

      startOnboarding: () => set({ isActive: true, currentStep: 0 }),
      
      completeOnboarding: () => set({ 
        hasCompletedOnboarding: true, 
        isActive: false,
        currentStep: 0 
      }),
      
      nextStep: () => set((state) => ({ 
        currentStep: state.currentStep + 1 
      })),
      
      previousStep: () => set((state) => ({ 
        currentStep: Math.max(0, state.currentStep - 1) 
      })),
      
      skipOnboarding: () => set({ 
        hasCompletedOnboarding: true,
        isActive: false,
        currentStep: 0
      }),
      
      setStep: (step: number) => set({ currentStep: step }),
    }),
    {
      name: 'jubee-onboarding-storage',
      partialize: (state) => ({ 
        hasCompletedOnboarding: state.hasCompletedOnboarding 
      }),
    }
  )
)
