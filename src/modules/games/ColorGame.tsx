import { useState } from 'react'
import { useJubeeStore } from '../../store/useJubeeStore'
import { useGameStore } from '../../store/useGameStore'

interface ColorChallenge {
  targetColor: Color
  options: Color[]
  type: 'match' | 'name' | 'mix'
}

interface Color {
  name: string
  hex: string
  emoji: string
}

const colors: Color[] = [
  { name: 'Red', hex: '#FF0000', emoji: '🍎' },
  { name: 'Blue', hex: '#0000FF', emoji: '💙' },
  { name: 'Yellow', hex: '#FFFF00', emoji: '⭐' },
  { name: 'Green', hex: '#00FF00', emoji: '🍀' },
  { name: 'Orange', hex: '#FFA500', emoji: '🍊' },
  { name: 'Purple', hex: '#800080', emoji: '🍇' },
  { name: 'Pink', hex: '#FFC0CB', emoji: '🌸' },
  { name: 'Brown', hex: '#8B4513', emoji: '🐻' },
  { name: 'Black', hex: '#000000', emoji: '🖤' },
  { name: 'White', hex: '#FFFFFF', emoji: '☁️' }
]

export default function ColorGame() {
  const [mode, setMode] = useState<'easy' | 'medium' | 'hard' | null>(null)
  const [challenge, setChallenge] = useState<ColorChallenge | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const speak = useJubeeStore(state => state.speak);
const triggerAnimation = useJubeeStore(state => state.triggerAnimation);
  const addScore = useGameStore(state => state.addScore);

  const generateChallenge = (difficulty: 'easy' | 'medium' | 'hard'): ColorChallenge => {
    const availableColors = difficulty === 'easy' ? colors.slice(0, 5) : 
                           difficulty === 'medium' ? colors.slice(0, 8) : colors
    
    const target = availableColors[Math.floor(Math.random() * availableColors.length)]
    const type: ('match' | 'name' | 'mix')[] = difficulty === 'easy' ? ['match'] :
                                                 difficulty === 'medium' ? ['match', 'name'] :
                                                 ['match', 'name', 'mix']
    
    const challengeType = type[Math.floor(Math.random() * type.length)]
    
    const wrongColors = availableColors.filter(c => c.name !== target.name)
    const optionColors = [
      target,
      ...wrongColors.sort(() => Math.random() - 0.5).slice(0, 3)
    ].sort(() => Math.random() - 0.5)
    
    return {
      targetColor: target,
      options: optionColors,
      type: challengeType
    }
  }

  const startGame = (difficulty: 'easy' | 'medium' | 'hard') => {
    setMode(difficulty)
    setScore(0)
    setStreak(0)
    setChallenge(generateChallenge(difficulty))
    triggerAnimation('excited')
    speak("Let's learn colors! Find the matching color!")
  }

  const handleAnswer = (selectedColor: Color) => {
    if (!challenge || !mode) return
    
    const isCorrect = selectedColor.name === challenge.targetColor.name
    
    if (isCorrect) {
      const points = (mode === 'easy' ? 15 : mode === 'medium' ? 25 : 35) * (streak + 1)
      setScore(prev => prev + points)
      setStreak(prev => prev + 1)
      addScore(points)
      triggerAnimation('celebrate')
      
      const responses = [
        `Perfect! That's ${challenge.targetColor.name}! 🎨`,
        `Amazing! ${challenge.targetColor.name} it is! ⭐`,
        `You got it! ${challenge.targetColor.name}! 🌈`,
        `Brilliant! That's ${challenge.targetColor.name}! 🎉`
      ]
      speak(responses[Math.floor(Math.random() * responses.length)])
      
      setTimeout(() => {
        setChallenge(generateChallenge(mode))
      }, 1500)
    } else {
      setStreak(0)
      triggerAnimation('idle')
      speak(`That's ${selectedColor.name}. Try finding ${challenge.targetColor.name}!`, 'curious')
      
      setTimeout(() => {
        setChallenge(generateChallenge(mode))
      }, 2000)
    }
  }

  const endGame = () => {
    speak(`Wonderful! You scored ${score} points learning colors!`, 'happy')
    setMode(null)
    setChallenge(null)
  }

  if (!mode) {
    return (
      <div className="color-game-menu p-4 sm:p-6 md:p-8 pt-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-6 md:mb-8 text-game">
          🌈 Color Splash! 🌈
        </h1>
        <p className="text-2xl text-center mb-12 text-game-neutral">
          Learn and match beautiful colors!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <button
            onClick={() => startGame('easy')}
            className="difficulty-card p-8 rounded-3xl transform hover:scale-105 transition-all duration-300 border-4 border-game-accent focus:outline-none focus-visible:ring-4 focus-visible:ring-primary"
            style={{
              background: 'var(--gradient-game)',
              boxShadow: 'var(--shadow-game)'
            }}
            aria-label="Easy difficulty"
          >
            <div className="text-6xl mb-4">🎨</div>
            <h2 className="text-3xl font-bold text-primary-foreground mb-2">Easy</h2>
            <p className="text-xl text-primary-foreground opacity-90">5 Basic Colors</p>
          </button>

          <button
            onClick={() => startGame('medium')}
            className="difficulty-card p-8 rounded-3xl transform hover:scale-105 transition-all duration-300 border-4 border-game-accent focus:outline-none focus-visible:ring-4 focus-visible:ring-primary"
            style={{
              background: 'var(--gradient-warm)',
              boxShadow: 'var(--shadow-accent)'
            }}
            aria-label="Medium difficulty"
          >
            <div className="text-6xl mb-4">🖌️</div>
            <h2 className="text-3xl font-bold text-primary-foreground mb-2">Medium</h2>
            <p className="text-xl text-primary-foreground opacity-90">8 Colors + Names</p>
          </button>

          <button
            onClick={() => startGame('hard')}
            className="difficulty-card p-8 rounded-3xl transform hover:scale-105 transition-all duration-300 border-4 border-game-accent focus:outline-none focus-visible:ring-4 focus-visible:ring-primary"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--secondary)))',
              boxShadow: 'var(--shadow-game)'
            }}
            aria-label="Hard difficulty"
          >
            <div className="text-6xl mb-4">🎭</div>
            <h2 className="text-3xl font-bold text-primary-foreground mb-2">Hard</h2>
            <p className="text-xl text-primary-foreground opacity-90">All Colors + Mixing</p>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="color-game p-4 sm:p-6 md:p-8 pt-8 min-h-screen">
      <div className="game-header mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4 text-game">
          Color Splash - {mode.charAt(0).toUpperCase() + mode.slice(1)}
        </h1>
        <div className="stats flex gap-8 justify-center text-2xl mb-6">
          <div className="stat text-game font-bold">
            Score: {score}
          </div>
          <div className="stat text-game-accent font-bold">
            🔥 Streak: {streak}
          </div>
        </div>
      </div>

      {challenge && (
        <div className="challenge-area max-w-4xl mx-auto">
          <div 
            className="question-card p-12 rounded-3xl mb-8 text-center border-4 border-game-accent"
            style={{
              background: 'var(--gradient-warm)',
              boxShadow: 'var(--shadow-game)',
              minHeight: '250px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <p className="text-3xl text-primary-foreground mb-6">
              {challenge.type === 'match' && 'Find this color:'}
              {challenge.type === 'name' && 'Which one is:'}
              {challenge.type === 'mix' && 'Find this color:'}
            </p>
            {challenge.type === 'match' && (
              <div 
                className="w-48 h-48 rounded-3xl border-8 border-white shadow-2xl"
                style={{ backgroundColor: challenge.targetColor.hex }}
              />
            )}
            {challenge.type === 'name' && (
              <p className="text-6xl font-bold text-primary-foreground">
                {challenge.targetColor.name}
              </p>
            )}
            {challenge.type === 'mix' && (
              <div className="flex items-center gap-4">
                <span className="text-7xl">{challenge.targetColor.emoji}</span>
                <div 
                  className="w-32 h-32 rounded-2xl border-8 border-white shadow-xl"
                  style={{ backgroundColor: challenge.targetColor.hex }}
                />
              </div>
            )}
          </div>

          <div className="options grid grid-cols-2 md:grid-cols-4 gap-6">
            {challenge.options.map((color) => (
              <button
                key={color.name}
                onClick={() => handleAnswer(color)}
                className="option-button p-6 rounded-3xl transform hover:scale-110 transition-all duration-200 border-4 border-white shadow-lg"
                style={{
                  backgroundColor: color.hex,
                  minHeight: '150px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span className="text-5xl">{color.emoji}</span>
                {mode !== 'easy' && (
                  <span 
                    className="text-xl font-bold"
                    style={{ 
                      color: color.name === 'White' || color.name === 'Yellow' ? '#000' : '#fff',
                      textShadow: color.name === 'White' || color.name === 'Yellow' ? 'none' : '2px 2px 4px rgba(0,0,0,0.5)'
                    }}
                  >
                    {color.name}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="controls text-center mt-12">
        <button
          onClick={endGame}
          className="px-8 py-4 text-2xl font-bold rounded-full transform hover:scale-105 transition-all text-primary-foreground border-3 border-game-accent focus:outline-none focus-visible:ring-4 focus-visible:ring-primary"
          style={{
            background: 'var(--gradient-warm)',
            boxShadow: 'var(--shadow-game)'
          }}
          aria-label="Back to Menu"
        >
          ← Back to Menu
        </button>
      </div>
    </div>
  )
}
