import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'
import { validatePosition, validateCanvasPosition, validateContainerPosition as validateContainerPos, getSafeDefaultPosition, type Position3D } from '@/core/jubee/JubeePositionValidator'
import { performHealthCheck, executeRecovery } from '@/core/jubee/JubeeErrorRecovery'
import { jubeeStateBackupService } from '@/lib/jubeeStateBackup'
import { callEdgeFunction } from '@/lib/edgeFunctionErrorHandler'
import { sanitizeString, validateNotEmpty, validateLength } from '@/lib/inputSanitizer'
import { logger } from '@/lib/logger'

// Extend Window interface for i18next properties
declare global {
  interface Window {
    i18nextLanguage?: string
  }
}

// Timer entry type for position update throttling
interface TimerEntry {
  time: number
}

// Cleanup timers map - can store either Timeout or TimerEntry
const timers = new Map<string, NodeJS.Timeout | TimerEntry>()

import { audioManager } from '@/lib/audioManager'

export type JubeeVoice = 'shimmer' | 'nova' | 'alloy' | 'echo' | 'fable' | 'onyx'

interface JubeeState {
  gender: 'male' | 'female'
  voice: JubeeVoice
  position: { x: number, y: number, z: number }
  containerPosition: { bottom: number, right: number }
  isDragging: boolean
  currentAnimation: string
  speechText: string
  currentMood: 'happy' | 'excited' | 'frustrated' | 'curious' | 'tired'
  isTransitioning: boolean
  isProcessing: boolean
  lastError: string | null
  isVisible: boolean
  interactionCount: number
  soundEffectsVolume: number
  voiceVolume: number
  setGender: (gender: 'male' | 'female') => void
  setVoice: (voice: JubeeVoice) => void
  updatePosition: (position: Position3D | null | undefined) => void
  setContainerPosition: (position: { bottom: number, right: number }) => void
  setIsDragging: (isDragging: boolean) => void
  setMood: (mood: 'happy' | 'excited' | 'frustrated' | 'curious' | 'tired') => void
  triggerAnimation: (animation: string) => void
  triggerPageTransition: () => void
  speak: (text: string, mood?: 'happy' | 'excited' | 'frustrated' | 'curious' | 'tired') => void
  converse: (message: string, context?: ConversationContext) => Promise<string>
  cleanup: () => void
  toggleVisibility: () => void
  setSoundEffectsVolume: (volume: number) => void
  setVoiceVolume: (volume: number) => void
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
      position: { x: 0, y: 0, z: 0 },
      containerPosition: getSafeDefaultPosition(), // Use validated safe default
      isDragging: false,
      currentAnimation: 'idle',
      speechText: '',
      currentMood: 'happy',
      isTransitioning: false,
      isProcessing: false,
      lastError: null,
      isVisible: true,
      interactionCount: 0,
      soundEffectsVolume: 0.3,
      voiceVolume: 1.0,

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
        const timerEntry = timers.get('positionUpdate')
        const lastUpdate = (timerEntry && 'time' in timerEntry) ? timerEntry.time : 0
        if (now - lastUpdate < 100) return
        
        timers.set('positionUpdate', { time: now })
        
        set((state) => {
          if (position) {
            const validated = validatePosition({ x: position.x, y: position.y, z: position.z })
            state.position = validated.canvas
          }
        })
      },

      setContainerPosition: (position) => {
        console.group('[🔍 DIAGNOSTIC] Container Position Update')
        console.log('Requested position:', position)
        console.log('Viewport:', { width: window.innerWidth, height: window.innerHeight })
        console.groupEnd()
        
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

      setMood: (mood) => {
        console.log('[Jubee] Mood changed:', mood)
        set((state) => { state.currentMood = mood })
      },

      toggleVisibility: () => {
        const currentVisibility = get().isVisible
        const newVisibility = !currentVisibility
        
        console.group('[🔍 DIAGNOSTIC] Jubee Visibility Toggle')
        console.log('Previous state:', currentVisibility)
        console.log('New state:', newVisibility)
        console.log('Stack trace:', new Error().stack)
        console.groupEnd()
        
        set((state) => {
          state.isVisible = newVisibility
        })
        
        // Log state after update
        setTimeout(() => {
          const finalState = get()
          console.log('[🔍 DIAGNOSTIC] Visibility update complete:', {
            isVisible: finalState.isVisible,
            containerPosition: finalState.containerPosition,
            position: finalState.position
          })
        }, 0)
      },

      triggerAnimation: (animation) => {
        console.log('[Jubee] Animation triggered:', animation)
        // Clear existing animation timer
        const existingTimer = timers.get('animation')
        if (existingTimer && typeof existingTimer !== 'object') {
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
        if (existingTimer && typeof existingTimer !== 'object') {
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
      // Validate and sanitize input
      try {
        validateNotEmpty(text, 'Speech text');
        validateLength(text, 'Speech text', 1, 1000);
        text = sanitizeString(text, { maxLength: 1000, trim: true });
      } catch (error) {
        logger.error('[Jubee] Invalid speech input:', error);
        return;
      }

      // Get current voice volume
      const voiceVolume = get().voiceVolume;
      
      // If volume is 0, don't play anything
      if (voiceVolume === 0) {
        console.log('[Jubee] Voice muted, skipping speech');
        return;
      }

      // Stop any current audio first
      audioManager.stopCurrentAudio()
      
      // Clear existing speech timer to prevent conflicts
      const existingSpeechTimer = timers.get('speech')
      if (existingSpeechTimer && typeof existingSpeechTimer !== 'object') {
        clearTimeout(existingSpeechTimer)
        timers.delete('speech')
      }

      const gender = get().gender
      const voice = get().voice
      const language = window.i18nextLanguage || 'en'
      
      set((state) => { 
        state.speechText = text
        state.currentMood = mood
        state.lastError = null
        state.interactionCount += 1
      })

      // Check cache first for instant playback
      const cachedAudio = audioManager.getCachedAudio(text, voice, mood)
      if (cachedAudio) {
        await audioManager.playAudio(cachedAudio, true, voiceVolume)
        set((state) => { state.speechText = '' })
        return
      }
      
      // Single TTS request with timeout using edge function handler
      try {
        const audioBlob = await callEdgeFunction<Blob>({
          functionName: 'text-to-speech',
          body: { text, gender, language, mood, voice },
          timeout: 8000,
          retries: 1,
        });

        // Cache for future use
        audioManager.cacheAudio(text, audioBlob, voice, mood)
        
        await audioManager.playAudio(audioBlob, true, voiceVolume)
        set((state) => { state.speechText = '' })
        return
      } catch (error) {
        logger.warn('[Jubee] TTS service unavailable, using browser fallback', error);
      }

      // All retries failed, use browser speech fallback
      set((state) => { state.lastError = 'TTS_FALLBACK' })
      browserSpeech(text, gender, mood, voiceVolume)
      const timer = setTimeout(() => {
        set((state) => { state.speechText = '' })
        timers.delete('speech')
      }, 3000)
      timers.set('speech', timer)
    },

    converse: async (message, context = {}) => {
      const state = get()
      
      if (state.isProcessing) {
        logger.warn('[Jubee] Already processing a conversation');
        return "Let me finish what I was saying first! 🐝"
      }

      // Validate and sanitize input
      try {
        validateNotEmpty(message, 'Message');
        validateLength(message, 'Message', 1, 2000);
        message = sanitizeString(message, { maxLength: 2000, trim: true });
      } catch (error) {
        logger.error('[Jubee] Invalid conversation input:', error);
        return "Bzz! That message doesn't look quite right. Could you try again? 🐝";
      }

      set((state) => {
        state.isProcessing = true
        state.currentMood = context.mood || 'happy'
        state.interactionCount += 1
      })

      const language = window.i18nextLanguage || 'en'

      try {
        const response = await callEdgeFunction<{ response: string }>({
          functionName: 'jubee-conversation',
          body: {
            message,
            context: {
              ...context,
              mood: state.currentMood,
              language,
            },
          },
          timeout: 15000,
          retries: 2,
        });

        const jubeeResponse = response.response;
        
        set((state) => { 
          state.isProcessing = false
          state.lastError = null
        })
        
        // Speak the response
        get().speak(jubeeResponse, context.mood || 'happy')
        
        return jubeeResponse;
      } catch (error) {
        logger.error('[Jubee] Conversation error:', error)
        
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
        timers.forEach((timer) => {
          // Only clear actual timeout timers, not TimerEntry objects
          if (!('time' in timer)) {
            clearTimeout(timer as NodeJS.Timeout)
          }
        })
        timers.clear()
        
        audioManager.cleanup()
        
        if ('speechSynthesis' in window) {
          speechSynthesis.cancel()
        }
      },

      setSoundEffectsVolume: (volume) => {
        const clampedVolume = Math.max(0, Math.min(1, volume))
        console.log('[Jubee] Sound effects volume changed:', clampedVolume)
        set((state) => { state.soundEffectsVolume = clampedVolume })
      },

      setVoiceVolume: (volume) => {
        const clampedVolume = Math.max(0, Math.min(1, volume))
        console.log('[Jubee] Voice volume changed:', clampedVolume)
        set((state) => { state.voiceVolume = clampedVolume })
      }
    })),
    {
      name: 'jubee-store',
      version: 2, // Increment version for schema changes
      partialize: (state) => ({ 
        gender: state.gender,
        voice: state.voice,
        containerPosition: state.containerPosition,
        position: state.position,
        isVisible: state.isVisible,
        currentAnimation: state.currentAnimation,
        soundEffectsVolume: state.soundEffectsVolume,
        voiceVolume: state.voiceVolume,
        // Persist last known good state for recovery
        lastError: null, // Reset errors on persist
        isProcessing: false, // Reset processing state
        isTransitioning: false // Reset transition state
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('[Jubee] Storage rehydration error:', error)
          // Fallback to safe defaults
          if (state) {
            const safeDefaults = getSafeDefaultPosition()
            state.containerPosition = safeDefaults
            state.position = { x: 0, y: 0, z: 0 }
            state.isVisible = true
            state.currentAnimation = 'idle'
          }
          return
        }
        
        if (state) {
          // Comprehensive state validation on load
          console.log('[Jubee] Rehydrating state from storage')
          
          // Validate and fix position
          const validated = validatePosition(state.position, state.containerPosition)
          state.containerPosition = validated.container
          state.position = validated.canvas
          
          // Ensure visibility is valid
          if (typeof state.isVisible !== 'boolean') {
            state.isVisible = true
          }
          
          // Ensure animation is valid
          if (!state.currentAnimation || typeof state.currentAnimation !== 'string') {
            state.currentAnimation = 'idle'
          }
          
          // Ensure gender is valid
          if (state.gender !== 'male' && state.gender !== 'female') {
            state.gender = 'female'
          }
          
          // Ensure voice is valid
          const validVoices: JubeeVoice[] = ['shimmer', 'nova', 'alloy', 'echo', 'fable', 'onyx']
          if (!validVoices.includes(state.voice)) {
            state.voice = 'shimmer'
          }
          
          // Reset transient states
          state.lastError = null
          state.isProcessing = false
          state.isTransitioning = false
          state.speechText = ''
          state.isDragging = false
          
          console.log('[Jubee] Rehydrated with validated state:', {
            containerPosition: state.containerPosition,
            position: state.position,
            isVisible: state.isVisible,
            currentAnimation: state.currentAnimation,
            gender: state.gender,
            voice: state.voice
          })
        }
      }
    }
  )
)

// Initialize backup service and start auto-backup
if (typeof window !== 'undefined') {
  // Initialize backup service
  jubeeStateBackupService.init().then(() => {
    // Start automatic backups
    jubeeStateBackupService.startAutoBackup(() => {
      const state = useJubeeStore.getState()
      return {
        gender: state.gender,
        voice: state.voice,
        position: state.position,
        containerPosition: state.containerPosition,
        isVisible: state.isVisible,
        currentAnimation: state.currentAnimation
      }
    })
  }).catch((error) => {
    console.error('[Jubee] Failed to initialize backup service:', error)
  })

  // Periodic health check with backup on issues
  setInterval(() => {
    const state = useJubeeStore.getState()
    const health = performHealthCheck(state)
    
    if (!health.isHealthy) {
      console.warn('[Jubee Health] Issues detected:', health.issues)
      
      // Create emergency backup before recovery
      jubeeStateBackupService.createBackup({
        gender: state.gender,
        voice: state.voice,
        position: state.position,
        containerPosition: state.containerPosition,
        isVisible: state.isVisible,
        currentAnimation: state.currentAnimation
      })
      
      if (health.recommendedAction !== 'none') {
        executeRecovery(health.recommendedAction, (updates) => {
          useJubeeStore.setState(updates)
        })
      }
    }
  }, 10000) // Check every 10 seconds
}

// Browser speech fallback helper with mood support
function browserSpeech(text: string, gender: 'male' | 'female', mood: string = 'happy', volume: number = 1.0) {
  if ('speechSynthesis' in window) {
    // CRITICAL: Cancel any ongoing browser speech to prevent overlap
    speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.volume = Math.max(0, Math.min(1, volume));
    
    // Set language based on i18n
    const language = window.i18nextLanguage || 'en'
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
    const i18n = window.i18next
    if (i18n) {
      window.i18nextLanguage = i18n.language
    }
  }
  
  // Update on language change
  if (window.i18next) {
    window.i18next.on('languageChanged', updateI18nLanguage)
    updateI18nLanguage()
  } else {
    // Retry after a short delay if i18next isn't loaded yet
    setTimeout(updateI18nLanguage, 100)
  }
}
