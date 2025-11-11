import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface JubeeState {
  gender: 'male' | 'female'
  position: { x: number, y: number, z: number }
  currentAnimation: string
  speechText: string
  isTransitioning: boolean
  setGender: (gender: 'male' | 'female') => void
  updatePosition: (position: any) => void
  triggerAnimation: (animation: string) => void
  triggerPageTransition: () => void
  speak: (text: string) => void
}

export const useJubeeStore = create<JubeeState>()(
  immer((set) => ({
    gender: 'female',
    position: { x: 3, y: -2, z: 0 },
    currentAnimation: 'idle',
    speechText: '',
    isTransitioning: false,

    setGender: (gender) => set((state) => { state.gender = gender }),

    updatePosition: (position) => set((state) => {
      if (position) {
        state.position = { x: position.x, y: position.y, z: position.z }
      }
    }),

    triggerAnimation: (animation) => set((state) => {
      state.currentAnimation = animation
      setTimeout(() => {
        set((state) => { state.currentAnimation = 'idle' })
      }, 2000)
    }),

    triggerPageTransition: () => {
      set((state) => {
        state.isTransitioning = true
        state.currentAnimation = 'pageTransition'
      })
      setTimeout(() => {
        set((state) => {
          state.isTransitioning = false
          state.currentAnimation = 'idle'
        })
      }, 1200)
    },

    speak: async (text) => {
      set((state) => { state.speechText = text })
      
      try {
        const response = await fetch('https://kphdqgidwipqdthehckg.supabase.co/functions/v1/text-to-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            text,
            gender: useJubeeStore.getState().gender 
          }),
        })

        if (response.ok) {
          const audioBlob = await response.blob()
          const audioUrl = URL.createObjectURL(audioBlob)
          const audio = new Audio(audioUrl)
          
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl)
            set((state) => { state.speechText = '' })
          }
          
          audio.play()
        } else {
          // Fallback to browser speech if API fails
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text)
            utterance.rate = 0.9
            utterance.pitch = useJubeeStore.getState().gender === 'female' ? 1.2 : 0.9
            speechSynthesis.speak(utterance)
          }
          setTimeout(() => {
            set((state) => { state.speechText = '' })
          }, 3000)
        }
      } catch (error) {
        console.error('Speech error:', error)
        // Fallback to browser speech
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text)
          utterance.rate = 0.9
          utterance.pitch = useJubeeStore.getState().gender === 'female' ? 1.2 : 0.9
          speechSynthesis.speak(utterance)
        }
        setTimeout(() => {
          set((state) => { state.speechText = '' })
        }, 3000)
      }
    }
  }))
)
