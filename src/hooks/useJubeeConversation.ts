import { useCallback } from 'react'
import { useJubeeStore } from '@/store/useJubeeStore'
import { sanitizeVoiceInput, sanitizeAIResponse } from '@/lib/voiceInputSanitizer'

/**
 * Hook for conversing with Jubee AI
 * Provides empathetic, child-friendly responses with fail-safes
 */
export function useJubeeConversation() {
  const { converse, isProcessing, lastError } = useJubeeStore()

  const askJubee = useCallback(async (
    message: string,
    options?: {
      activity?: string
      mood?: 'happy' | 'excited' | 'frustrated' | 'curious' | 'tired'
      childName?: string
    }
  ) => {
    if (!message.trim()) {
      console.warn('Empty message provided to Jubee')
      return null
    }

    // Sanitize conversation input
    const sanitized = sanitizeVoiceInput(message, 'conversation')
    
    if (!sanitized.isValid) {
      console.warn('Invalid conversation input:', sanitized.reason)
      return "Let's talk about something fun!"
    }

    try {
      const response = await converse(sanitized.sanitized, options)
      // Sanitize AI response before returning
      return sanitizeAIResponse(response || "Let's try that again!")
    } catch (error) {
      console.error('Conversation failed:', error)
      return null
    }
  }, [converse])

  return {
    askJubee,
    isProcessing,
    lastError,
  }
}
