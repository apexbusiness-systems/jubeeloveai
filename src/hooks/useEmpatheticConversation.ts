import { useCallback, useMemo } from 'react'
import { useJubeeStore } from '@/store/useJubeeStore'

/**
 * Enhanced conversation hook with sentiment awareness
 * SECURITY: Includes input validation and safe sentiment detection
 */

interface ConversationOptions {
  activity?: string
  childName?: string
  detectSentiment?: boolean
}

const MAX_MESSAGE_LENGTH = 500
const MAX_NAME_LENGTH = 50
const MAX_ACTIVITY_LENGTH = 200

export function useEmpatheticConversation() {
  const { converse, speak, isProcessing } = useJubeeStore()

  /**
   * SECURE sentiment detection with input validation
   */
  const detectSentiment = useMemo(() => (message: string): {
    mood: 'happy' | 'excited' | 'frustrated' | 'curious' | 'tired'
    confidence: number
  } => {
    // SECURITY: Validate input
    if (!message || typeof message !== 'string') {
      return { mood: 'happy', confidence: 0.5 }
    }

    // SECURITY: Limit length to prevent performance issues
    const msg = message.slice(0, MAX_MESSAGE_LENGTH).toLowerCase()
    
    try {
      // SAFE: Use simple string checks instead of complex regex
      const hasExclamation = msg.includes('!')
      const hasQuestion = msg.includes('?')
      
      // Excitement patterns - safe word checking
      if (hasExclamation && (msg.includes('wow') || msg.includes('yay') || msg.includes('love'))) {
        return { mood: 'excited', confidence: 0.8 }
      }
      
      // Frustration patterns - safe word checking
      if (msg.includes('hard') || msg.includes('difficult') || msg.includes('help') || msg.includes('stuck')) {
        return { mood: 'frustrated', confidence: 0.75 }
      }
      
      // Curiosity patterns - safe word checking
      if (hasQuestion || msg.includes('what') || msg.includes('why') || msg.includes('how')) {
        return { mood: 'curious', confidence: 0.7 }
      }
      
      // Tiredness patterns - safe word checking
      if (msg.includes('tired') || msg.includes('sleepy') || msg.includes('boring') || msg.includes('done')) {
        return { mood: 'tired', confidence: 0.7 }
      }
      
      // Positive default - safe word checking
      if (msg.includes('good') || msg.includes('great') || msg.includes('yes') || msg.includes('fun')) {
        return { mood: 'happy', confidence: 0.6 }
      }
      
      return { mood: 'happy', confidence: 0.5 }
    } catch (error) {
      // FALLBACK: Safe default if detection fails
      console.error('Sentiment detection error:', error)
      return { mood: 'happy', confidence: 0.5 }
    }
  }, [])

  /**
   * SECURE message sending with validation
   */
  const sendMessage = useCallback(async (
    message: string,
    options: ConversationOptions = {}
  ) => {
    // SECURITY: Validate message
    if (!message || typeof message !== 'string' || !message.trim()) {
      console.warn('Empty or invalid message provided')
      return null
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      console.warn(`Message too long: ${message.length} > ${MAX_MESSAGE_LENGTH}`)
      return null
    }

    // SECURITY: Validate child name
    if (options.childName && options.childName.length > MAX_NAME_LENGTH) {
      console.warn('Child name too long')
      options.childName = options.childName.slice(0, MAX_NAME_LENGTH)
    }

    // SECURITY: Validate activity
    if (options.activity && options.activity.length > MAX_ACTIVITY_LENGTH) {
      console.warn('Activity description too long')
      options.activity = options.activity.slice(0, MAX_ACTIVITY_LENGTH)
    }

    try {
      // SAFE sentiment detection
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
  }, [converse, detectSentiment])

  /**
   * SECURE speaking with sentiment-aware voice modulation
   */
  const speakWithEmpathy = useCallback(async (
    text: string,
    options?: {
      mood?: 'happy' | 'excited' | 'frustrated' | 'curious' | 'tired'
      autoDetect?: boolean
    }
  ) => {
    // SECURITY: Validate text
    if (!text || typeof text !== 'string' || !text.trim()) {
      console.warn('Empty or invalid text for speech')
      return
    }

    let mood = options?.mood

    // SAFE auto-detection if enabled
    if (options?.autoDetect && !mood) {
      try {
        const sentiment = detectSentiment(text)
        mood = sentiment.mood
      } catch (error) {
        console.error('Auto-detect failed:', error)
        mood = 'happy'
      }
    }

    await speak(text, mood || 'happy')
  }, [speak, detectSentiment])

  return {
    sendMessage,
    speakWithEmpathy,
    detectSentiment,
    isProcessing
  }
}
