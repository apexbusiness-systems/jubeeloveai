import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface JubeeState {
  gender: 'male' | 'female'
  position: { x: number, y: number, z: number }
  currentAnimation: string
  speechText: string
  setGender: (gender: 'male' | 'female') => void
  updatePosition: (position: any) => void
  triggerAnimation: (animation: string) => void
  speak: (text: string) => void
}

export const useJubeeStore = create<JubeeState>()(
  immer((set) => ({
    gender: 'female',
    position: { x: 3, y: -2, z: 0 },
    currentAnimation: 'idle',
    speechText: '',

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

    speak: (text) => set((state) => {
      state.speechText = text
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 0.9
        utterance.pitch = state.gender === 'female' ? 1.2 : 0.9
        speechSynthesis.speak(utterance)
      }
      setTimeout(() => {
        set((state) => { state.speechText = '' })
      }, 3000)
    })
  }))
)
