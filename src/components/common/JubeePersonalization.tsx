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
        className="bg-white rounded-3xl p-8 max-w-2xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
        style={{
          border: '4px solid #FFD93D',
          boxShadow: '0 10px 40px rgba(255, 71, 87, 0.3)'
        }}
      >
        <h2 className="text-4xl font-bold text-center mb-8" style={{ color: '#FF4757' }}>
          🐝 Customize Jubee! 🐝
        </h2>

        <p className="text-2xl text-center mb-8 text-gray-700">
          Is Jubee a boy or a girl?
        </p>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => setSelectedGender('male')}
            className="gender-option p-8 rounded-3xl transform hover:scale-105 transition-all duration-300"
            style={{
              background: selectedGender === 'male'
                ? 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)'
                : 'linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%)',
              border: selectedGender === 'male' ? '4px solid #2563EB' : '4px solid #9CA3AF',
              boxShadow: selectedGender === 'male'
                ? '0 8px 20px rgba(59, 130, 246, 0.4)'
                : '0 4px 10px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="text-8xl mb-4">👦</div>
            <h3 className="text-3xl font-bold" style={{
              color: selectedGender === 'male' ? 'white' : '#4B5563'
            }}>
              Boy
            </h3>
            <p className="text-xl mt-2" style={{
              color: selectedGender === 'male' ? 'white' : '#6B7280',
              opacity: 0.9
            }}>
              Blue accents
            </p>
          </button>

          <button
            onClick={() => setSelectedGender('female')}
            className="gender-option p-8 rounded-3xl transform hover:scale-105 transition-all duration-300"
            style={{
              background: selectedGender === 'female'
                ? 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)'
                : 'linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%)',
              border: selectedGender === 'female' ? '4px solid #DB2777' : '4px solid #9CA3AF',
              boxShadow: selectedGender === 'female'
                ? '0 8px 20px rgba(236, 72, 153, 0.4)'
                : '0 4px 10px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="text-8xl mb-4">👧</div>
            <h3 className="text-3xl font-bold" style={{
              color: selectedGender === 'female' ? 'white' : '#4B5563'
            }}>
              Girl
            </h3>
            <p className="text-xl mt-2" style={{
              color: selectedGender === 'female' ? 'white' : '#6B7280',
              opacity: 0.9
            }}>
              Pink accents
            </p>
          </button>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={onClose}
            className="px-8 py-4 text-2xl font-bold rounded-full transform hover:scale-105 transition-all"
            style={{
              background: 'linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%)',
              color: '#4B5563',
              border: '3px solid #9CA3AF',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-8 py-4 text-2xl font-bold rounded-full transform hover:scale-105 transition-all"
            style={{
              background: 'linear-gradient(135deg, #FFD93D 0%, #FF4757 100%)',
              color: 'white',
              border: '3px solid #FFD93D',
              boxShadow: '0 4px 10px rgba(255, 71, 87, 0.3)'
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
