import { useCallback } from 'react'
import { useJubeeStore } from '@/store/useJubeeStore'

/**
 * Enhanced conversation hook with sentiment awareness
 * Provides empathetic, emotionally intelligent responses
 */

interface ConversationOptions {
  activity?: string
  childName?: string
  detectSentiment?: boolean
}

export function useEmpatheticConversation() {
  const { converse, speak, isProcessing } = useJubeeStore()

  /**
   * Analyze message sentiment on client side for better UX
   */
  const detectSentiment = (message: string): {
    mood: 'happy' | 'excited' | 'frustrated' | 'curious' | 'tired'
    confidence: number
  } => {
    const msg = message.toLowerCase()
    
    // Excitement patterns
    if (msg.includes('!') || /\b(wow|yay|love|amazing|awesome|cool)\b/.test(msg)) {
      return { mood: 'excited', confidence: 0.8 }
    }
    
    // Frustration patterns
    if (/\b(hard|difficult|cant|can't|dont|don't|help|stuck|confused)\b/.test(msg)) {
      return { mood: 'frustrated', confidence: 0.75 }
    }
    
    // Curiosity patterns
    if (msg.includes('?') || /\b(what|why|how|when|where)\b/.test(msg)) {
      return { mood: 'curious', confidence: 0.7 }
    }
    
    // Tiredness patterns
    if (/\b(tired|sleepy|boring|done|stop)\b/.test(msg)) {
      return { mood: 'tired', confidence: 0.7 }
    }
    
    // Default to happy for positive messages
    if (/\b(good|great|yes|like|fun)\b/.test(msg)) {
      return { mood: 'happy', confidence: 0.6 }
    }
    
    return { mood: 'happy', confidence: 0.5 }
  }

  /**
   * Send message with automatic sentiment detection
   */
  const sendMessage = useCallback(async (
    message: string,
    options: ConversationOptions = {}
  ) => {
    if (!message.trim()) {
      console.warn('Empty message provided')
      return null
    }

    try {
      // Detect sentiment for better mood context
      const sentiment = options.detectSentiment !== false 
        ? detectSentiment(message) 
        : null

      const response = await converse(message, {
        activity: options.activity,
        childName: options.childName,
        mood: sentiment?.mood || 'happy'
      })

      return response
    } catch (error) {
      console.error('Empathetic conversation failed:', error)
      return null
    }
  }, [converse])

  /**
   * Speak with sentiment-aware voice modulation
   */
  const speakWithEmpathy = useCallback(async (
    text: string,
    options?: {
      mood?: 'happy' | 'excited' | 'frustrated' | 'curious' | 'tired'
      autoDetect?: boolean
    }
  ) => {
    let mood = options?.mood

    // Auto-detect mood from text if enabled
    if (options?.autoDetect && !mood) {
      const sentiment = detectSentiment(text)
      mood = sentiment.mood
    }

    await speak(text, mood || 'happy')
  }, [speak])

  return {
    sendMessage,
    speakWithEmpathy,
    detectSentiment,
    isProcessing
  }
}
