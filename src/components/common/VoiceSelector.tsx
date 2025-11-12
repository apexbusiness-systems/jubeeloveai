import { useState } from 'react'
import { useJubeeStore, type JubeeVoice } from '@/store/useJubeeStore'
import { Button } from '@/components/ui/button'
import { Volume2 } from 'lucide-react'

interface Props {
  onClose: () => void
}

interface VoiceOption {
  id: JubeeVoice
  name: string
  description: string
  emoji: string
  color: string
}

const voiceOptions: VoiceOption[] = [
  {
    id: 'shimmer',
    name: 'Shimmer',
    description: 'Warm & friendly',
    emoji: '✨',
    color: 'from-pink-400 to-purple-400'
  },
  {
    id: 'nova',
    name: 'Nova',
    description: 'Bright & cheerful',
    emoji: '🌟',
    color: 'from-yellow-400 to-orange-400'
  },
  {
    id: 'alloy',
    name: 'Alloy',
    description: 'Clear & balanced',
    emoji: '🎯',
    color: 'from-blue-400 to-cyan-400'
  },
  {
    id: 'echo',
    name: 'Echo',
    description: 'Smooth & calm',
    emoji: '🎵',
    color: 'from-teal-400 to-green-400'
  },
  {
    id: 'fable',
    name: 'Fable',
    description: 'Storyteller voice',
    emoji: '📖',
    color: 'from-indigo-400 to-blue-400'
  },
  {
    id: 'onyx',
    name: 'Onyx',
    description: 'Deep & strong',
    emoji: '💎',
    color: 'from-gray-600 to-gray-800'
  }
]

export function VoiceSelector({ onClose }: Props) {
  const { voice, setVoice, speak, triggerAnimation } = useJubeeStore()
  const [selectedVoice, setSelectedVoice] = useState<JubeeVoice>(voice)
  const [testingVoice, setTestingVoice] = useState<JubeeVoice | null>(null)

  const handleTestVoice = async (voiceId: JubeeVoice) => {
    setTestingVoice(voiceId)
    // Temporarily set voice for testing
    const currentVoice = voice
    setVoice(voiceId)
    await speak(`Hi! I'm ${voiceOptions.find(v => v.id === voiceId)?.name}!`)
    // Restore original voice if not selected
    if (selectedVoice !== voiceId) {
      setVoice(currentVoice)
    }
    setTestingVoice(null)
  }

  const handleSave = () => {
    setVoice(selectedVoice)
    triggerAnimation('celebrate')
    speak("I love my new voice!")
    setTimeout(() => {
      onClose()
    }, 1500)
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-3xl p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border-4 border-game-accent"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: 'var(--shadow-elevated)' }}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-game">
          🎤 Choose Jubee's Voice! 🎤
        </h2>

        <p className="text-xl text-center mb-6 text-game-neutral">
          Pick a voice that you like best!
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {voiceOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedVoice(option.id)}
              className="relative p-6 rounded-2xl transform hover:scale-105 transition-all duration-300 text-left"
              style={{
                background: selectedVoice === option.id
                  ? `linear-gradient(135deg, var(--gradient-warm))`
                  : 'hsl(var(--muted))',
                border: selectedVoice === option.id 
                  ? '3px solid hsl(var(--game-accent))' 
                  : '3px solid hsl(var(--border))',
                boxShadow: selectedVoice === option.id
                  ? 'var(--shadow-game)'
                  : '0 2px 8px hsl(var(--muted) / 0.3)'
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-5xl">{option.emoji}</div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTestVoice(option.id)
                  }}
                  disabled={testingVoice === option.id}
                  className="h-8 w-8"
                  style={{
                    background: testingVoice === option.id 
                      ? 'hsl(var(--primary))' 
                      : 'transparent'
                  }}
                >
                  <Volume2 className={`h-4 w-4 ${testingVoice === option.id ? 'animate-pulse' : ''}`} />
                </Button>
              </div>
              
              <h3 
                className="text-2xl font-bold mb-1"
                style={{
                  color: selectedVoice === option.id 
                    ? 'hsl(var(--primary-foreground))' 
                    : 'hsl(var(--foreground))'
                }}
              >
                {option.name}
              </h3>
              
              <p 
                className="text-lg opacity-90"
                style={{
                  color: selectedVoice === option.id 
                    ? 'hsl(var(--primary-foreground))' 
                    : 'hsl(var(--muted-foreground))'
                }}
              >
                {option.description}
              </p>

              {selectedVoice === option.id && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-game-accent flex items-center justify-center">
                  <span className="text-sm">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-4 justify-center flex-wrap">
          <Button
            onClick={onClose}
            variant="outline"
            size="lg"
            className="px-8 py-6 text-xl font-bold"
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            size="lg"
            className="px-8 py-6 text-xl font-bold"
            style={{
              background: 'var(--gradient-warm)',
              boxShadow: 'var(--shadow-game)'
            }}
          >
            Save Voice
          </Button>
        </div>
      </div>
    </div>
  )
}
