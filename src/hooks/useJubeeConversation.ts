import { useCallback } from 'react'
import { useJubeeStore } from '@/store/useJubeeStore'

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

    try {
      const response = await converse(message, options)
      return response
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
