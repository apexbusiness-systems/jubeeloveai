import { useState } from 'react'
import { useJubeeStore } from '../../store/useJubeeStore'

interface Props {
  onClose: () => void
}

export function JubeePersonalization({ onClose }: Props) {
  const { gender, setGender, speak, triggerAnimation } = useJubeeStore()
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>(gender)

  const handleSave = () => {
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

        <div className="grid grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => setSelectedGender('male')}
            className="gender-option p-8 rounded-3xl transform hover:scale-105 transition-all duration-300"
            style={{
              background: selectedGender === 'male'
                ? 'var(--gradient-boy)'
                : 'var(--gradient-neutral)',
              border: selectedGender === 'male' ? '4px solid hsl(var(--boy-border))' : '4px solid hsl(var(--border))',
              boxShadow: selectedGender === 'male'
                ? '0 8px 20px hsl(var(--boy-primary) / 0.4)'
                : '0 4px 10px hsl(var(--muted) / 0.3)'
            }}
          >
            <div className="text-8xl mb-4">👦</div>
            <h3 className="text-3xl font-bold" style={{
              color: selectedGender === 'male' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))'
            }}>
              Boy
            </h3>
            <p className="text-xl mt-2 opacity-90" style={{
              color: selectedGender === 'male' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))'
            }}>
              Blue accents
            </p>
          </button>

          <button
            onClick={() => setSelectedGender('female')}
            className="gender-option p-8 rounded-3xl transform hover:scale-105 transition-all duration-300"
            style={{
              background: selectedGender === 'female'
                ? 'var(--gradient-girl)'
                : 'var(--gradient-neutral)',
              border: selectedGender === 'female' ? '4px solid hsl(var(--girl-border))' : '4px solid hsl(var(--border))',
              boxShadow: selectedGender === 'female'
                ? '0 8px 20px hsl(var(--girl-primary) / 0.4)'
                : '0 4px 10px hsl(var(--muted) / 0.3)'
            }}
          >
            <div className="text-8xl mb-4">👧</div>
            <h3 className="text-3xl font-bold" style={{
              color: selectedGender === 'female' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))'
            }}>
              Girl
            </h3>
            <p className="text-xl mt-2 opacity-90" style={{
              color: selectedGender === 'female' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))'
            }}>
              Pink accents
            </p>
          </button>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={onClose}
            className="px-8 py-4 text-2xl font-bold rounded-full transform hover:scale-105 transition-all text-game-neutral border-3 border-border"
            style={{
              background: 'var(--gradient-neutral)',
              boxShadow: '0 4px 10px hsl(var(--muted) / 0.3)'
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-8 py-4 text-2xl font-bold rounded-full transform hover:scale-105 transition-all text-primary-foreground border-3 border-game-accent"
            style={{
              background: 'var(--gradient-warm)',
              boxShadow: 'var(--shadow-game)'
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
