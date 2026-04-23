import { useState } from 'react'
import { motion } from 'framer-motion'
import { triggerConfetti } from '@/lib/confetti'
import { useJubeeStore } from '../../store/useJubeeStore'
import { Button } from '@/components/ui/button'
import { useAudioEffects } from '@/hooks/useAudioEffects'

interface Props {
  onClose: () => void
  onOpenVoiceSelector: () => void
}

export function JubeePersonalization({ onClose, onOpenVoiceSelector }: Props) {
  const gender = useJubeeStore(state => state.gender);
const setGender = useJubeeStore(state => state.setGender);
const speak = useJubeeStore(state => state.speak);
const triggerAnimation = useJubeeStore(state => state.triggerAnimation);
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>(gender)
  const { playSuccessSound, playClearSound } = useAudioEffects()

  const handleSave = async () => {
    playSuccessSound()
    setGender(selectedGender)
    triggerAnimation('celebrate')
    speak(selectedGender === 'male' ? "I'm a boy bee! Buzz buzz!" : "I'm a girl bee! Buzz buzz!")
    
    // Trigger confetti celebration
    triggerConfetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: selectedGender === 'male' 
        ? ['#3b82f6', '#60a5fa', '#93c5fd', '#fbbf24', '#fcd34d'] 
        : ['#ec4899', '#f472b6', '#fbcfe8', '#fbbf24', '#fcd34d']
    })
    
    setTimeout(() => {
      onClose()
    }, 1500)
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0, y: 100 }}
        animate={{ scale: 1, y: 0 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
          duration: 0.6
        }}
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
            className="gender-option p-8 rounded-3xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary"
            aria-label="Select boy gender"
            style={{
              background: 'var(--gradient-boy)',
              border: selectedGender === 'male' ? '4px solid hsl(var(--boy-border))' : '4px solid hsl(var(--boy-primary) / 0.5)',
              boxShadow: selectedGender === 'male'
                ? '0 8px 20px hsl(var(--boy-primary) / 0.4)'
                : '0 4px 10px hsl(var(--boy-primary) / 0.2)',
              opacity: selectedGender === 'male' ? 1 : 0.7
            }}
            aria-label="Select boy gender"
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
            className="gender-option p-8 rounded-3xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary"
            aria-label="Select girl gender"
            style={{
              background: 'var(--gradient-girl)',
              border: selectedGender === 'female' ? '4px solid hsl(var(--girl-border))' : '4px solid hsl(var(--girl-primary) / 0.5)',
              boxShadow: selectedGender === 'female'
                ? '0 8px 20px hsl(var(--girl-primary) / 0.4)'
                : '0 4px 10px hsl(var(--girl-primary) / 0.2)',
              opacity: selectedGender === 'female' ? 1 : 0.7
            }}
            aria-label="Select girl gender"
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
            className="px-8 py-4 text-2xl font-bold rounded-full transform hover:scale-105 transition-all text-primary-foreground border-3 border-muted focus:outline-none focus-visible:ring-4 focus-visible:ring-primary"
            style={{
              background: 'var(--gradient-warm)',
              boxShadow: 'var(--shadow-game)'
            }}
            aria-label="Cancel customization"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-8 py-4 text-2xl font-bold rounded-full transform hover:scale-105 transition-all text-primary-foreground border-3 border-accent focus:outline-none focus-visible:ring-4 focus-visible:ring-primary"
            style={{
              background: 'var(--gradient-game)',
              boxShadow: 'var(--shadow-accent)'
            }}
            aria-label="Save changes"
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  )
}
