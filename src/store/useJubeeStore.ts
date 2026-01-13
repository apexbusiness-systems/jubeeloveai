import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'
import { validatePosition, getSafeDefaultPosition, type Position3D } from '@/core/jubee/JubeePositionValidator'
import { jubeeStateBackupService } from '@/lib/jubeeStateBackup'
import { callEdgeFunction } from '@/lib/edgeFunctionErrorHandler'
import { sanitizeString, validateNotEmpty } from '@/lib/inputSanitizer'
import { logger } from '@/lib/logger'
import { audioManager } from '@/lib/audioManager'

// Extend Window interface for i18next properties
declare global {
  interface Window {
    i18nextLanguage?: string
  }
}

// Timer entry type
interface TimerEntry {
  time: number
}

// Global reference to prevent audio overlap
let currentSpeechController: AbortController | null = null;
const timers = new Map<string, NodeJS.Timeout | TimerEntry>()

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
  isMinimized: boolean
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
  toggleMinimized: () => void
  setSoundEffectsVolume: (volume: number) => void
  setVoiceVolume: (volume: number) => void
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
      containerPosition: getSafeDefaultPosition(),
      isDragging: false,
      currentAnimation: 'idle',
      speechText: '',
      currentMood: 'happy',
      isTransitioning: false,
      isProcessing: false,
      lastError: null,
      isVisible: true,
      isMinimized: false,
      interactionCount: 0,
      soundEffectsVolume: 0.3,
      voiceVolume: 1.0,

      setGender: (gender) => set((state) => { state.gender = gender }),
      setVoice: (voice) => set((state) => { state.voice = voice }),

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
        set((state) => {
          const validated = validatePosition(undefined, position)
          state.containerPosition = validated.container
        })
      },

      setIsDragging: (isDragging) => set((state) => { state.isDragging = isDragging }),
      setMood: (mood) => set((state) => { state.currentMood = mood }),
      toggleVisibility: () => set((state) => { state.isVisible = !state.isVisible }),
      toggleMinimized: () => set((state) => { state.isMinimized = !state.isMinimized }),

      triggerAnimation: (animation) => {
        const existingTimer = timers.get('animation')
        if (existingTimer && typeof existingTimer !== 'object') clearTimeout(existingTimer)
        set((state) => { state.currentAnimation = animation })
        const timer = setTimeout(() => {
          set((state) => { state.currentAnimation = 'idle' })
          timers.delete('animation')
        }, 2000)
        timers.set('animation', timer)
      },

      triggerPageTransition: () => {
        const existingTimer = timers.get('transition')
        if (existingTimer && typeof existingTimer !== 'object') clearTimeout(existingTimer)
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

      speak: async (text, mood = 'happy') => {
        // 1. Sanitize
        try {
            validateNotEmpty(text, 'Speech text');
            text = sanitizeString(text, { maxLength: 1000, trim: true });
        } catch (error) {
            logger.error('[Jubee] Invalid speech input:', error);
            return;
        }

        // 2. Check Volume
        const { voiceVolume, gender, voice } = get();
        if (voiceVolume === 0) return;

        // 3. 🛑 ABORT PREVIOUS SPEECH (Crucial Fix)
        if (currentSpeechController) {
            currentSpeechController.abort();
            audioManager.stopCurrentAudio();
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        }
        currentSpeechController = new AbortController();
        const signal = currentSpeechController.signal;

        set((state) => {
            state.speechText = text;
            state.currentMood = mood;
            state.lastError = null;
            state.interactionCount += 1;
        });

        // 4. Try Cache (memory + IndexedDB) / Edge Function
        try {
            const language = window.i18nextLanguage || 'en';
            
            // Check memory + persistent cache (async)
            const cachedAudio = await audioManager.getCachedAudioAsync(text, voice, mood);
            
            if (cachedAudio) {
                if (signal.aborted) return;
                await audioManager.playAudio(cachedAudio, true, voiceVolume);
            } else {
                // Fetch new from TTS service
                const audioBlob = await callEdgeFunction<Blob>({
                    functionName: 'text-to-speech',
                    body: { text, gender, language, mood, voice },
                    timeout: 8000,
                    retries: 1,
                });
                
                if (signal.aborted) return;
                
                // Cache persistently for offline use
                await audioManager.cacheAudioPersistent(text, audioBlob, voice, mood);
                await audioManager.playAudio(audioBlob, true, voiceVolume);
            }
        } catch (error) {
            if (signal.aborted) return;
            logger.warn('[Jubee] TTS service unavailable, using fallback');
            browserSpeech(text, gender, mood, voiceVolume);
        } finally {
            if (!signal.aborted) {
                set((state) => { state.speechText = '' });
            }
        }
      },

      converse: async (message, context = {}) => {
        const state = get()
        if (state.isProcessing) return "One moment, please! 🐝"

        set((state) => {
          state.isProcessing = true
          state.currentMood = context.mood || 'happy'
          state.interactionCount += 1
        })

        try {
          const response = await callEdgeFunction<{ response: string }>({
            functionName: 'jubee-conversation',
            body: {
              message,
              context: { ...context, mood: state.currentMood, language: window.i18nextLanguage || 'en' },
            },
            timeout: 15000,
            retries: 2,
          });

          set((state) => { state.isProcessing = false })
          get().speak(response.response, context.mood || 'happy')
          return response.response;
        } catch (error) {
          set((state) => { 
            state.isProcessing = false
            state.lastError = 'CONVERSATION_ERROR'
          })
          const fallback = "Buzz! I'm having trouble thinking right now. 🐝";
          get().speak(fallback, 'frustrated');
          return fallback;
        }
      },

      cleanup: () => {
        timers.forEach((t) => { if (!('time' in t)) clearTimeout(t as NodeJS.Timeout) });
        timers.clear();
        audioManager.cleanup();
        if (currentSpeechController) currentSpeechController.abort();
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      },

      setSoundEffectsVolume: (v) => set((s) => { s.soundEffectsVolume = Math.max(0, Math.min(1, v)) }),
      setVoiceVolume: (v) => set((s) => { s.voiceVolume = Math.max(0, Math.min(1, v)) })
    })),
    {
      name: 'jubee-store',
      version: 3, // Bumped version
      partialize: (state) => ({ 
        gender: state.gender,
        voice: state.voice,
        containerPosition: state.containerPosition,
        isVisible: state.isVisible,
        soundEffectsVolume: state.soundEffectsVolume,
        voiceVolume: state.voiceVolume
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
            // Validation Logic
            const validated = validatePosition(state.position, state.containerPosition);
            state.containerPosition = validated.container;
            state.isProcessing = false;
        }
      }
    }
  )
)

// Browser Speech Fallback
function browserSpeech(text: string, gender: 'male' | 'female', mood: string, volume: number) {
  if (!('speechSynthesis' in window)) return;
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.volume = volume;
  utterance.rate = mood === 'excited' ? 1.2 : mood === 'tired' ? 0.9 : 1.1;
  utterance.pitch = gender === 'female' ? 1.2 : 1.0;
  
  window.speechSynthesis.speak(utterance);
}

// Backup Service Init
if (typeof window !== 'undefined') {
  jubeeStateBackupService.init().catch(logger.error);
}

