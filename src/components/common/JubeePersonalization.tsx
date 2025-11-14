import { useState } from 'react'
import { useJubeeStore } from '../../store/useJubeeStore'
import { Button } from '@/components/ui/button'
import { useAudioEffects } from '@/hooks/useAudioEffects'

interface Props {
  onClose: () => void
  onOpenVoiceSelector: () => void
}

export function JubeePersonalization({ onClose, onOpenVoiceSelector }: Props) {
  const { gender, setGender, speak, triggerAnimation } = useJubeeStore()
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>(gender)
  const { playSuccessSound, playClearSound } = useAudioEffects()

  const handleSave = () => {
    playSuccessSound()
    setGender(selectedGender)
    triggerAnimation('celebrate')
    speak(selectedGender === 'male' ? "I'm a boy bee! Buzz buzz!" : "I'm a girl bee! Buzz buzz!")
    setTimeout(() => {
      onClose()
    }, 1500)
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-3xl p-8 max-w-2xl w-full mx-4 border-4 border-game-accent"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: 'var(--shadow-elevated)' }}
      >
        <h2 className="text-4xl font-bold text-center mb-8 text-game">
          🐝 Customize Jubee! 🐝
        </h2>

        <p className="text-2xl text-center mb-8 text-game-neutral">
          Is Jubee a boy or a girl?
        </p>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <button
            onClick={() => {
              playSuccessSound()
              setSelectedGender('male')
            }}
            className="gender-option p-8 rounded-3xl transform hover:scale-105 transition-all duration-300"
            style={{
              background: 'var(--gradient-boy)',
              border: selectedGender === 'male' ? '4px solid hsl(var(--boy-border))' : '4px solid hsl(var(--boy-primary) / 0.5)',
              boxShadow: selectedGender === 'male'
                ? '0 8px 20px hsl(var(--boy-primary) / 0.4)'
                : '0 4px 10px hsl(var(--boy-primary) / 0.2)',
              opacity: selectedGender === 'male' ? 1 : 0.7
            }}
          >
            <div className="text-8xl mb-4">👦</div>
            <h3 className="text-3xl font-bold text-white">
              Boy
            </h3>
            <p className="text-xl mt-2 opacity-90 text-white">
              Male Voice
            </p>
          </button>

          <button
            onClick={() => {
              playSuccessSound()
              setSelectedGender('female')
            }}
            className="gender-option p-8 rounded-3xl transform hover:scale-105 transition-all duration-300"
            style={{
              background: 'var(--gradient-girl)',
              border: selectedGender === 'female' ? '4px solid hsl(var(--girl-border))' : '4px solid hsl(var(--girl-primary) / 0.5)',
              boxShadow: selectedGender === 'female'
                ? '0 8px 20px hsl(var(--girl-primary) / 0.4)'
                : '0 4px 10px hsl(var(--girl-primary) / 0.2)',
              opacity: selectedGender === 'female' ? 1 : 0.7
            }}
          >
            <div className="text-8xl mb-4">👧</div>
            <h3 className="text-3xl font-bold text-white">
              Girl
            </h3>
            <p className="text-xl mt-2 opacity-90 text-white">
              Female Voice
            </p>
          </button>
        </div>

        <div className="mb-8">
          <Button
            onClick={() => {
              onClose()
              onOpenVoiceSelector()
            }}
            variant="outline"
            size="lg"
            className="w-full text-xl py-6"
          >
            🎤 Choose Voice
          </Button>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => {
              playClearSound()
              onClose()
            }}
            className="px-8 py-4 text-2xl font-bold rounded-full transform hover:scale-105 transition-all text-white border-3 border-purple-400"
            style={{
              background: 'linear-gradient(135deg, hsl(270, 70%, 60%), hsl(280, 65%, 50%))',
              boxShadow: '0 4px 10px hsl(270, 70%, 40% / 0.4)'
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-8 py-4 text-2xl font-bold rounded-full transform hover:scale-105 transition-all text-white border-3 border-yellow-400"
            style={{
              background: 'linear-gradient(135deg, hsl(45, 90%, 55%), hsl(35, 95%, 50%))',
              boxShadow: '0 6px 15px hsl(40, 90%, 50% / 0.5)'
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
