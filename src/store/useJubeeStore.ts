import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'
import { validatePosition, getSafeDefaultPosition } from '@/core/jubee/JubeePositionValidator'
import { performHealthCheck, executeRecovery } from '@/core/jubee/JubeeErrorRecovery'

// Cleanup timers map
const timers = new Map<string, NodeJS.Timeout>()
let currentAudio: HTMLAudioElement | null = null

export type JubeeVoice = 'shimmer' | 'nova' | 'alloy' | 'echo' | 'fable' | 'onyx'

interface JubeeState {
  gender: 'male' | 'female'
  voice: JubeeVoice
  position: { x: number, y: number, z: number }
  containerPosition: { bottom: number, right: number }
  isDragging: boolean
  currentAnimation: string
  speechText: string
  isTransitioning: boolean
  isProcessing: boolean
  lastError: string | null
  isVisible: boolean
  setGender: (gender: 'male' | 'female') => void
  setVoice: (voice: JubeeVoice) => void
  updatePosition: (position: any) => void
  setContainerPosition: (position: { bottom: number, right: number }) => void
  setIsDragging: (isDragging: boolean) => void
  triggerAnimation: (animation: string) => void
  triggerPageTransition: () => void
  speak: (text: string, mood?: 'happy' | 'excited' | 'frustrated' | 'curious' | 'tired') => void
  converse: (message: string, context?: ConversationContext) => Promise<string>
  cleanup: () => void
  toggleVisibility: () => void
}

// Position bounds to prevent off-screen positioning
const POSITION_BOUNDS = {
  x: { min: -6, max: 6 },
  y: { min: -4, max: 4 },
  z: { min: -2, max: 2 }
}

interface ConversationContext {
  activity?: string
  mood?: 'happy' | 'excited' | 'frustrated' | 'curious' | 'tired'
  childName?: string
}

export const useJubeeStore = create<JubeeState>()(
  persist(
    immer((set, get) => ({
      gender: 'female',
      voice: 'shimmer',
      position: { x: 2.5, y: -1.5, z: 0 },
      containerPosition: { bottom: 200, right: 100 }, // Safe default position
      isDragging: false,
      currentAnimation: 'idle',
      speechText: '',
      isTransitioning: false,
      isProcessing: false,
      lastError: null,
      isVisible: true,

      setGender: (gender) => {
        console.log('[Jubee] Gender changed:', gender)
        set((state) => { state.gender = gender })
      },

      setVoice: (voice) => {
        console.log('[Jubee] Voice changed:', voice)
        set((state) => { state.voice = voice })
      },

      updatePosition: (position) => {
        const now = Date.now()
        const lastUpdate = (timers.get('positionUpdate') as any)?.time || 0
        if (now - lastUpdate < 100) return
        
        timers.set('positionUpdate', { time: now } as any)
        
        set((state) => {
          if (position) {
            const validated = validatePosition({ x: position.x, y: position.y, z: position.z })
            state.position = validated.canvas
          }
        })
      },

      setContainerPosition: (position) => {
        set((state) => {
          const validated = validatePosition(undefined, position)
          state.containerPosition = validated.container
          console.log('[Jubee] Container position validated:', validated.container)
        })
      },

      setIsDragging: (isDragging) => {
        set((state) => {
          state.isDragging = isDragging
        })
      },

      toggleVisibility: () => {
        set((state) => {
          state.isVisible = !state.isVisible
          console.log('[Jubee] Visibility toggled:', state.isVisible)
        })
      },

      triggerAnimation: (animation) => {
        console.log('[Jubee] Animation triggered:', animation)
        // Clear existing animation timer
        const existingTimer = timers.get('animation')
        if (existingTimer) {
          clearTimeout(existingTimer)
        }
        
        set((state) => { state.currentAnimation = animation })
        
        const timer = setTimeout(() => {
          set((state) => { state.currentAnimation = 'idle' })
          timers.delete('animation')
          console.log('[Jubee] Animation reset to idle')
        }, 2000)
        
        timers.set('animation', timer)
      },

      triggerPageTransition: () => {
        console.log('[Jubee] Page transition started')
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
          console.log('[Jubee] Page transition complete')
        }, 1200)
        
        timers.set('transition', timer)
      },

    speak: async (text, mood = 'happy') => {
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
      
      const gender = get().gender
      const voice = get().voice
      // Get current language from i18n if available
      const language = (window as any).i18nextLanguage || 'en'
      set((state) => { 
        state.speechText = text
        state.lastError = null
      })
      
      // Retry logic with exponential backoff
      const maxRetries = 2
      let retryCount = 0
      let retryDelay = 1000

      const attemptTTS = async (): Promise<boolean> => {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

          const response = await fetch('https://kphdqgidwipqdthehckg.supabase.co/functions/v1/text-to-speech', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text, gender, language, mood, voice }),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

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
            return true
          }
          return false
        } catch (error) {
          console.error(`TTS attempt ${retryCount + 1} failed:`, error)
          return false
        }
      }

      // Try TTS with retries
      while (retryCount <= maxRetries) {
        const success = await attemptTTS()
        if (success) return

        retryCount++
        if (retryCount <= maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          retryDelay *= 2 // Exponential backoff
        }
      }

      // All retries failed, use browser speech fallback
      console.warn('TTS service unavailable, using browser fallback')
      set((state) => { state.lastError = 'TTS_FALLBACK' })
      useBrowserSpeech(text, gender, mood)
      const timer = setTimeout(() => {
        set((state) => { state.speechText = '' })
        timers.delete('speech')
      }, 3000)
      timers.set('speech', timer)
    },

    converse: async (message, context = {}) => {
      const state = get()
      
      if (state.isProcessing) {
        console.warn('Already processing a conversation')
        return "Let me finish what I was saying first! 🐝"
      }

      set((state) => { 
        state.isProcessing = true
        state.lastError = null
      })

      const language = (window as any).i18nextLanguage || 'en'
      const maxRetries = 2
      let retryCount = 0

      try {
        while (retryCount <= maxRetries) {
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

            const response = await fetch('https://kphdqgidwipqdthehckg.supabase.co/functions/v1/jubee-conversation', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                message, 
                language,
                childName: context.childName,
                context: {
                  activity: context.activity,
                  mood: context.mood,
                }
              }),
              signal: controller.signal,
            })

            clearTimeout(timeoutId)

            const data = await response.json()

            if (data.success || data.fallback) {
              const aiResponse = data.response
              
              // Speak with contextual mood
              const speechMood = context.mood || 'happy'
              get().speak(aiResponse, speechMood)
              
              // Show animation matching mood
              get().triggerAnimation(context.mood || 'excited')
              
              set((state) => { state.isProcessing = false })
              return aiResponse
            }

            if (response.status === 429) {
              throw new Error('RATE_LIMIT')
            }

            throw new Error(data.error || 'Unknown error')
          } catch (error) {
            retryCount++
            
            if (error instanceof Error && error.name === 'AbortError') {
              console.error('Conversation request timed out')
            }
            
            if (retryCount > maxRetries) {
              throw error
            }
            
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
          }
        }

        throw new Error('Max retries exceeded')
      } catch (error) {
        console.error('Conversation error:', error)
        
        // Provide empathetic fallback messages
        const fallbackMessages: Record<string, string> = {
          en: "Buzz buzz! I'm listening to you, but I'm having trouble finding the right words. Let's try again in a moment! 🐝💛",
          es: "¡Bzz bzz! Te estoy escuchando, pero tengo problemas para encontrar las palabras correctas. ¡Intentemos de nuevo en un momento! 🐝💛",
          fr: "Bzz bzz! Je t'écoute, mais j'ai du mal à trouver les bons mots. Réessayons dans un instant! 🐝💛",
          zh: "嗡嗡！我在听你说话，但我很难找到合适的词语。让我们稍后再试一次！🐝💛",
          hi: "भनभन! मैं आपको सुन रहा हूं, लेकिन मुझे सही शब्द खोजने में परेशानी हो रही है। चलिए एक पल में फिर से कोशिश करते हैं! 🐝💛"
        }

        const fallbackMessage = fallbackMessages[language] || fallbackMessages.en
        
        set((state) => { 
          state.isProcessing = false
          state.lastError = error instanceof Error ? error.message : 'CONVERSATION_ERROR'
        })

        // Still speak the fallback with frustrated mood
        get().speak(fallbackMessage, 'frustrated')
        
        return fallbackMessage
      }
    },

      cleanup: () => {
        console.log('[Jubee] Cleanup called')
        timers.forEach((timer) => clearTimeout(timer))
        timers.clear()
        
        if (currentAudio) {
          currentAudio.pause()
          currentAudio = null
        }
        
        if ('speechSynthesis' in window) {
          speechSynthesis.cancel()
        }
      }
    })),
    {
      name: 'jubee-store',
      partialize: (state) => ({ 
        gender: state.gender,
        voice: state.voice,
        containerPosition: state.containerPosition 
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Validate persisted position on load
          const validated = validatePosition(state.position, state.containerPosition)
          state.containerPosition = validated.container
          console.log('[Jubee] Rehydrated with validated position')
        }
      }
    }
  )
)

// Periodic health check
if (typeof window !== 'undefined') {
  setInterval(() => {
    const state = useJubeeStore.getState()
    const health = performHealthCheck(state)
    
    if (!health.isHealthy) {
      console.warn('[Jubee Health] Issues detected:', health.issues)
      if (health.recommendedAction !== 'none') {
        executeRecovery(health.recommendedAction, (updates) => {
          useJubeeStore.setState(updates)
        })
      }
    }
  }, 10000) // Check every 10 seconds
}

// Browser speech fallback helper with mood support
function useBrowserSpeech(text: string, gender: 'male' | 'female', mood: string = 'happy') {
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
    
    // Adjust rate and pitch based on mood
    let rate = 1.1
    let pitchMultiplier = gender === 'female' ? 1.3 : 1.0
    
    if (mood === 'excited') {
      rate = 1.3
      pitchMultiplier = gender === 'female' ? 1.4 : 1.1
    } else if (mood === 'happy') {
      rate = 1.2
      pitchMultiplier = gender === 'female' ? 1.3 : 1.0
    } else if (mood === 'curious') {
      rate = 1.1
      pitchMultiplier = gender === 'female' ? 1.2 : 0.95
    } else if (mood === 'frustrated') {
      rate = 0.95
      pitchMultiplier = gender === 'female' ? 1.1 : 0.85
    } else if (mood === 'tired') {
      rate = 0.9
      pitchMultiplier = gender === 'female' ? 1.0 : 0.8
    }
    
    utterance.rate = rate
    utterance.pitch = pitchMultiplier
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
