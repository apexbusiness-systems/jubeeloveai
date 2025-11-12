import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

// Cleanup timers map
const timers = new Map<string, NodeJS.Timeout>()
let currentAudio: HTMLAudioElement | null = null

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
  cleanup: () => void
}

export const useJubeeStore = create<JubeeState>()(
  immer((set) => ({
    gender: 'female',
    position: { x: 3, y: -2, z: 0 },
    currentAnimation: 'idle',
    speechText: '',
    isTransitioning: false,

    setGender: (gender) => set((state) => { state.gender = gender }),

    updatePosition: (position) => {
      // Throttle position updates to avoid excessive store updates
      const now = Date.now()
      const lastUpdate = (timers.get('positionUpdate') as any)?.time || 0
      if (now - lastUpdate < 100) return // Update max 10 times per second
      
      timers.set('positionUpdate', { time: now } as any)
      
      set((state) => {
        if (position && 
            (Math.abs(state.position.x - position.x) > 0.01 ||
             Math.abs(state.position.y - position.y) > 0.01 ||
             Math.abs(state.position.z - position.z) > 0.01)) {
          state.position = { x: position.x, y: position.y, z: position.z }
        }
      })
    },

    triggerAnimation: (animation) => {
      // Clear existing animation timer
      const existingTimer = timers.get('animation')
      if (existingTimer) {
        clearTimeout(existingTimer)
      }
      
      set((state) => { state.currentAnimation = animation })
      
      const timer = setTimeout(() => {
        set((state) => { state.currentAnimation = 'idle' })
        timers.delete('animation')
      }, 2000)
      
      timers.set('animation', timer)
    },

    triggerPageTransition: () => {
      // Clear existing transition timer
      const existingTimer = timers.get('transition')
      if (existingTimer) {
        clearTimeout(existingTimer)
      }
      
      set((state) => {
        state.isTransitioning = true
        state.currentAnimation = 'pageTransition'
      })
      
      const timer = setTimeout(() => {
        set((state) => {
          state.isTransitioning = false
          state.currentAnimation = 'idle'
        })
        timers.delete('transition')
      }, 1200)
      
      timers.set('transition', timer)
    },

    speak: async (text) => {
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause()
        currentAudio = null
      }
      
      // Clear existing speech timer
      const existingTimer = timers.get('speech')
      if (existingTimer) {
        clearTimeout(existingTimer)
      }
      
      const gender = useJubeeStore.getState().gender
      // Get current language from i18n if available
      const language = (window as any).i18nextLanguage || 'en'
      set((state) => { state.speechText = text })
      
      try {
        const response = await fetch('https://kphdqgidwipqdthehckg.supabase.co/functions/v1/text-to-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text, gender, language }),
        })

        if (response.ok) {
          const audioBlob = await response.blob()
          const audioUrl = URL.createObjectURL(audioBlob)
          const audio = new Audio(audioUrl)
          currentAudio = audio
          
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl)
            currentAudio = null
            set((state) => { state.speechText = '' })
          }
          
          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl)
            currentAudio = null
            set((state) => { state.speechText = '' })
          }
          
          await audio.play()
        } else {
          // Fallback to browser speech
          useBrowserSpeech(text, gender)
          const timer = setTimeout(() => {
            set((state) => { state.speechText = '' })
            timers.delete('speech')
          }, 3000)
          timers.set('speech', timer)
        }
      } catch (error) {
        console.error('Speech error:', error)
        // Fallback to browser speech
        useBrowserSpeech(text, gender)
        const timer = setTimeout(() => {
          set((state) => { state.speechText = '' })
          timers.delete('speech')
        }, 3000)
        timers.set('speech', timer)
      }
    },

    cleanup: () => {
      // Clear all timers
      timers.forEach((timer) => clearTimeout(timer))
      timers.clear()
      
      // Stop audio
      if (currentAudio) {
        currentAudio.pause()
        currentAudio = null
      }
      
      // Stop browser speech
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel()
      }
    }
  }))
)

// Browser speech fallback helper
function useBrowserSpeech(text: string, gender: 'male' | 'female') {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text)
    
    // Set language based on i18n
    const language = (window as any).i18nextLanguage || 'en'
    const langMap: Record<string, string> = {
      'en': 'en-US',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'zh': 'zh-CN',
      'hi': 'hi-IN'
    }
    utterance.lang = langMap[language] || 'en-US'
    
    utterance.rate = 0.9
    utterance.pitch = gender === 'female' ? 1.2 : 0.9
    speechSynthesis.speak(utterance)
  }
}

// Expose language for the store
if (typeof window !== 'undefined') {
  const updateI18nLanguage = () => {
    const i18n = (window as any).i18next
    if (i18n) {
      (window as any).i18nextLanguage = i18n.language
    }
  }
  
  // Update on language change
  if ((window as any).i18next) {
    (window as any).i18next.on('languageChanged', updateI18nLanguage)
    updateI18nLanguage()
  } else {
    // Retry after a short delay if i18next isn't loaded yet
    setTimeout(updateI18nLanguage, 100)
  }
}
