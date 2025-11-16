import { useState, useCallback, useRef } from 'react'
import { useJubeeStore } from '@/store/useJubeeStore'
import { useGameStore } from '@/store/useGameStore'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Loader2, Volume2, Sparkles } from 'lucide-react'
import { sanitizeVoiceInput, checkPronunciation, sanitizeAIResponse } from '@/lib/voiceInputSanitizer'
import { supabase } from '@/integrations/supabase/client'

interface WordLesson {
  word: string
  image: string
  pronunciation: string
}

// Age-appropriate word list with visual representations
const WORD_LESSONS: WordLesson[] = [
  { word: 'cat', image: '🐱', pronunciation: 'kat' },
  { word: 'dog', image: '🐕', pronunciation: 'dawg' },
  { word: 'bee', image: '🐝', pronunciation: 'bee' },
  { word: 'sun', image: '☀️', pronunciation: 'suhn' },
  { word: 'moon', image: '🌙', pronunciation: 'moon' },
  { word: 'star', image: '⭐', pronunciation: 'star' },
  { word: 'tree', image: '🌳', pronunciation: 'tree' },
  { word: 'house', image: '🏠', pronunciation: 'hous' },
  { word: 'ball', image: '⚽', pronunciation: 'bawl' },
  { word: 'car', image: '🚗', pronunciation: 'kar' },
  { word: 'book', image: '📚', pronunciation: 'book' },
  { word: 'apple', image: '🍎', pronunciation: 'ap-puhl' },
  { word: 'fish', image: '🐟', pronunciation: 'fish' },
  { word: 'bird', image: '🐦', pronunciation: 'burd' },
  { word: 'heart', image: '❤️', pronunciation: 'hart' },
  { word: 'flower', image: '🌸', pronunciation: 'flow-er' },
]

export default function ReadingPractice() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  
  const { speak, triggerAnimation, converse } = useJubeeStore()
  const { addScore } = useGameStore()
  const { toast } = useToast()

  const currentWord = WORD_LESSONS[currentWordIndex]

  const playWordPronunciation = useCallback(() => {
    triggerAnimation('talking')
    speak(`This word is ${currentWord.word}. Can you say ${currentWord.word}?`)
  }, [currentWord, speak, triggerAnimation])

  const getJubeeEncouragement = useCallback(async (
    isCorrect: boolean,
    spokenWord: string,
    targetWord: string,
    similarity: number
  ) => {
    try {
      const context = isCorrect 
        ? `The child correctly pronounced "${targetWord}"`
        : `The child said "${spokenWord}" but was trying to say "${targetWord}" (${Math.round(similarity * 100)}% similar)`

      const response = await converse(
        context,
        {
          activity: 'reading-practice',
          mood: isCorrect ? 'happy' : 'encouraging',
          childName: 'friend'
        }
      )

      return sanitizeAIResponse(response || (isCorrect 
        ? "Great job! You're doing amazing!"
        : "That's okay! Let's try again together!"))
    } catch (error) {
      console.error('Failed to get Jubee response:', error)
      return isCorrect 
        ? "Wonderful! You said it perfectly!"
        : "Nice try! Let's practice together!"
    }
  }, [converse])

  const handlePronunciationCheck = useCallback(async (spokenText: string) => {
    // Sanitize voice input
    const sanitized = sanitizeVoiceInput(spokenText, 'reading')
    
    if (!sanitized.isValid) {
      toast({
        title: "Let's try again",
        description: sanitized.reason || "Please say the word clearly",
        variant: "destructive"
      })
      triggerAnimation('confused')
      speak(sanitized.reason || "I didn't quite catch that. Let's try again!")
      return
    }

    // Check pronunciation
    const result = checkPronunciation(sanitized.sanitized, currentWord.word)
    setAttempts(prev => prev + 1)

    if (result.isMatch) {
      // Correct pronunciation!
      setCorrectCount(prev => prev + 1)
      addScore(20)
      triggerAnimation('celebrate')

      const encouragement = await getJubeeEncouragement(
        true,
        sanitized.sanitized,
        currentWord.word,
        result.similarity
      )
      speak(encouragement)

      toast({
        title: "Perfect! 🎉",
        description: `You said "${currentWord.word}" correctly!`,
      })

      // Move to next word after a delay
      setTimeout(() => {
        if (currentWordIndex < WORD_LESSONS.length - 1) {
          setCurrentWordIndex(prev => prev + 1)
          setAttempts(0)
          triggerAnimation('excited')
          speak(`Great! Let's learn a new word!`)
        } else {
          // Completed all words!
          addScore(50)
          triggerAnimation('celebrate')
          speak(`Amazing! You learned all the words! You're a reading star!`)
        }
      }, 3000)
    } else {
      // Needs practice
      triggerAnimation('thinking')
      
      const encouragement = await getJubeeEncouragement(
        false,
        sanitized.sanitized,
        currentWord.word,
        result.similarity
      )
      speak(encouragement)

      if (attempts >= 2) {
        // After 2 attempts, provide extra help
        setTimeout(() => {
          triggerAnimation('talking')
          speak(`Let me help you. Listen carefully: ${currentWord.word}. Now you try!`)
        }, 2000)
      }
    }
  }, [currentWord, currentWordIndex, attempts, addScore, speak, triggerAnimation, toast, getJubeeEncouragement])

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
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
          
          const reader = new FileReader()
          reader.readAsDataURL(audioBlob)
          
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1]
            
            // Send to speech-to-text edge function
            const { data, error } = await supabase.functions.invoke('speech-to-text', {
              body: { audio: base64Audio }
            })
            
            if (error) {
              throw new Error('Failed to transcribe audio')
            }
            
            if (data?.text) {
              await handlePronunciationCheck(data.text)
            }
          }
        } catch (error) {
          console.error('Voice recognition error:', error)
          toast({
            title: "Oops!",
            description: "I couldn't hear you clearly. Try again!",
            variant: "destructive"
          })
          triggerAnimation('confused')
        } finally {
          setIsProcessing(false)
          stream.getTracks().forEach(track => track.stop())
        }
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsListening(true)
      
      // Auto-stop after 3 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          stopListening()
        }
      }, 3000)
      
    } catch (error) {
      console.error('Microphone access error:', error)
      toast({
        title: "Microphone needed",
        description: "Please allow microphone access to practice pronunciation",
        variant: "destructive"
      })
    }
  }, [toast, handlePronunciationCheck, triggerAnimation])

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop()
      setIsListening(false)
    }
  }, [isListening])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8" />
            Reading with Jubee
            <Sparkles className="w-8 h-8" />
          </h1>
          <p className="text-lg text-muted-foreground">
            Practice saying words out loud!
          </p>
          <div className="flex gap-4 justify-center mt-4">
            <div className="bg-primary/10 px-4 py-2 rounded-full">
              <span className="text-sm font-semibold text-primary">
                Words Learned: {correctCount}/{WORD_LESSONS.length}
              </span>
            </div>
            <div className="bg-accent px-4 py-2 rounded-full">
              <span className="text-sm font-semibold text-accent-foreground">
                Word {currentWordIndex + 1} of {WORD_LESSONS.length}
              </span>
            </div>
          </div>
        </div>

        {/* Word Display Card */}
        <div className="bg-card border-4 border-primary/20 rounded-3xl p-8 md:p-12 shadow-2xl mb-6">
          <div className="text-center">
            {/* Image */}
            <div className="text-9xl mb-6 animate-scale-in">
              {currentWord.image}
            </div>
            
            {/* Word */}
            <h2 className="text-6xl md:text-7xl font-bold text-primary mb-4">
              {currentWord.word}
            </h2>
            
            {/* Pronunciation Guide */}
            <p className="text-2xl text-muted-foreground mb-6">
              sounds like: <span className="font-semibold text-primary">{currentWord.pronunciation}</span>
            </p>

            {/* Listen Button */}
            <Button
              onClick={playWordPronunciation}
              variant="secondary"
              size="lg"
              className="mb-6"
            >
              <Volume2 className="w-5 h-5 mr-2" />
              Listen to Jubee
            </Button>
          </div>
        </div>

        {/* Microphone Button */}
        <div className="text-center">
          <Button
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
            size="lg"
            className={`
              h-24 w-24 rounded-full text-2xl font-bold
              ${isListening ? 'animate-pulse bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'}
            `}
          >
            {isProcessing ? (
              <Loader2 className="w-10 h-10 animate-spin" />
            ) : isListening ? (
              <MicOff className="w-10 h-10" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
          </Button>
          <p className="mt-4 text-lg font-semibold text-primary">
            {isProcessing 
              ? "Listening..." 
              : isListening 
                ? "Say the word now!" 
                : "Tap to practice!"}
          </p>
          {attempts > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Attempts: {attempts}
            </p>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-accent/30 rounded-2xl p-6 border-2 border-accent">
          <h3 className="font-bold text-lg text-primary mb-2">How to Play:</h3>
          <ol className="list-decimal list-inside space-y-2 text-foreground">
            <li>Look at the picture and word</li>
            <li>Press the Listen button to hear Jubee say it</li>
            <li>Press the microphone and say the word</li>
            <li>Jubee will help you if you need it!</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
