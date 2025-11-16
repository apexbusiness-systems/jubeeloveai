import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { sanitizeVoiceInput } from '@/lib/voiceInputSanitizer'

interface VoiceCommandOptions {
  onTranscription?: (text: string) => void
  onCommand?: (command: string) => void
}

/**
 * Hook for voice commands using OpenAI Whisper
 * Enables hands-free navigation throughout the app
 */
export function useVoiceCommands(options: VoiceCommandOptions = {}) {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const navigate = useNavigate()
  const { toast } = useToast()

  const parseCommand = useCallback((text: string) => {
    const lowerText = text.toLowerCase().trim()
    
    // Navigation commands
    const commandMap: Record<string, string> = {
      'home': '/',
      'go home': '/',
      'shapes': '/shapes',
      'shape sorter': '/shapes',
      'writing': '/writing',
      'draw': '/writing',
      'drawing': '/writing',
      'stickers': '/stickers',
      'sticker book': '/stickers',
      'progress': '/progress',
      'my progress': '/progress',
      'settings': '/settings',
      'gallery': '/gallery',
      'my gallery': '/gallery',
      'parental controls': '/parental-controls',
      'reading': '/reading',
      'reading practice': '/reading',
      'learn to read': '/reading',
    }

    for (const [command, route] of Object.entries(commandMap)) {
      if (lowerText.includes(command)) {
        return route
      }
    }

    return null
  }, [])

  const processTranscription = useCallback(async (text: string) => {
    // Sanitize voice input for security
    const sanitized = sanitizeVoiceInput(text, 'navigation')
    
    if (!sanitized.isValid) {
      toast({
        title: "Voice Command",
        description: sanitized.reason || "Command not recognized",
        variant: "destructive"
      })
      return
    }

    options.onTranscription?.(sanitized.sanitized)
    
    const route = parseCommand(sanitized.sanitized)
    
    if (route) {
      options.onCommand?.(sanitized.sanitized)
      navigate(route)
      toast({
        title: "Voice Command",
        description: `Navigating to ${route}`,
      })
    } else {
      toast({
        title: "Voice Command",
        description: "Command not recognized. Try 'home', 'shapes', 'writing', 'stickers', 'progress', or 'settings'",
        variant: "destructive"
      })
    }
  }, [navigate, parseCommand, options, toast])

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        } 
      })
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })
      
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        setIsProcessing(true)
        
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          
          // Convert to base64
          const reader = new FileReader()
          reader.readAsDataURL(audioBlob)
          
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1]
            
            // Send to edge function
            const response = await fetch(
              'https://kphdqgidwipqdthehckg.supabase.co/functions/v1/speech-to-text',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ audio: base64Audio }),
              }
            )
            
            if (!response.ok) {
              throw new Error('Failed to transcribe audio')
            }
            
            const data = await response.json()
            
            if (data.text) {
              await processTranscription(data.text)
            }
          }
        } catch (error) {
          console.error('Voice command error:', error)
          toast({
            title: "Error",
            description: "Failed to process voice command",
            variant: "destructive"
          })
        } finally {
          setIsProcessing(false)
          stream.getTracks().forEach(track => track.stop())
        }
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsListening(true)
      
      toast({
        title: "Listening...",
        description: "Say a command like 'go home' or 'open shapes'",
      })
    } catch (error) {
      console.error('Microphone access error:', error)
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive"
      })
    }
  }, [processTranscription, toast])

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop()
      setIsListening(false)
    }
  }, [isListening])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  return {
    isListening,
    isProcessing,
    startListening,
    stopListening,
    toggleListening,
  }
}
