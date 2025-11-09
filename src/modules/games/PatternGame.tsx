import { useState, useEffect } from 'react'
import { useJubeeStore } from '../../store/useJubeeStore'
import { useGameStore } from '../../store/useGameStore'

interface PatternItem {
  id: number
  emoji: string
  color: string
}

const patterns: PatternItem[] = [
  { id: 1, emoji: '🐝', color: '#FFD93D' },
  { id: 2, emoji: '🌺', color: '#FF4757' },
  { id: 3, emoji: '🦋', color: '#FF6348' },
  { id: 4, emoji: '⭐', color: '#FFEB3B' }
]

export default function PatternGame() {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null)
  const [sequence, setSequence] = useState<number[]>([])
  const [playerSequence, setPlayerSequence] = useState<number[]>([])
  const [isShowingPattern, setIsShowingPattern] = useState(false)
  const [activePattern, setActivePattern] = useState<number | null>(null)
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const { speak, triggerAnimation } = useJubeeStore()
  const { addPoints } = useGameStore()

  const speeds = {
    easy: 1000,
    medium: 700,
    hard: 500
  }

  const startGame = (diff: 'easy' | 'medium' | 'hard') => {
    setDifficulty(diff)
    setLevel(1)
    setScore(0)
    triggerAnimation('excited')
    speak("Watch the pattern and repeat it!")
    setTimeout(() => generateSequence(1, diff), 1000)
  }

  const generateSequence = (currentLevel: number, diff: 'easy' | 'medium' | 'hard') => {
    const newSequence = []
    for (let i = 0; i < currentLevel + 2; i++) {
      newSequence.push(Math.floor(Math.random() * 4))
    }
    setSequence(newSequence)
    setPlayerSequence([])
    playSequence(newSequence, diff)
  }

  const playSequence = async (seq: number[], diff: 'easy' | 'medium' | 'hard') => {
    setIsShowingPattern(true)
    for (let i = 0; i < seq.length; i++) {
      await new Promise(resolve => setTimeout(resolve, speeds[diff]))
      setActivePattern(seq[i])
      await new Promise(resolve => setTimeout(resolve, speeds[diff] / 2))
      setActivePattern(null)
    }
    setIsShowingPattern(false)
    speak("Now it's your turn!")
  }

  const handlePatternClick = (index: number) => {
    if (isShowingPattern) return

    const newPlayerSequence = [...playerSequence, index]
    setPlayerSequence(newPlayerSequence)

    // Flash the clicked pattern
    setActivePattern(index)
    setTimeout(() => setActivePattern(null), 200)

    // Check if the player's move is correct
    if (sequence[newPlayerSequence.length - 1] !== index) {
      // Wrong move
      triggerAnimation('thinking')
      speak("Oops! Let's try again!")
      setTimeout(() => {
        if (difficulty) {
          playSequence(sequence, difficulty)
        }
      }, 1500)
      setPlayerSequence([])
      return
    }

    // Check if the player completed the sequence
    if (newPlayerSequence.length === sequence.length) {
      // Correct sequence!
      const points = 30 * level
      setScore(score + points)
      addPoints(points)
      triggerAnimation('celebrate')
      speak("Perfect! Let's make it harder!")

      setTimeout(() => {
        setLevel(level + 1)
        if (difficulty) {
          generateSequence(level + 1, difficulty)
        }
      }, 1500)
    }
  }

  if (!difficulty) {
    return (
      <div className="pattern-game-menu p-8">
        <h1 className="text-5xl font-bold text-center mb-8" style={{ color: '#FF4757' }}>
          🎯 Pattern Game! 🎯
        </h1>
        <p className="text-2xl text-center mb-12 text-gray-700">
          Watch the pattern and repeat it!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <button
            onClick={() => startGame('easy')}
            className="difficulty-card p-8 rounded-3xl transform hover:scale-105 transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #FFD93D 0%, #FF6348 100%)',
              border: '4px solid #FFD93D',
              boxShadow: '0 8px 20px rgba(255, 71, 87, 0.3)'
            }}
          >
            <div className="text-6xl mb-4">😊</div>
            <h2 className="text-3xl font-bold text-white mb-2">Easy</h2>
            <p className="text-xl text-white opacity-90">Slow speed</p>
          </button>

          <button
            onClick={() => startGame('medium')}
            className="difficulty-card p-8 rounded-3xl transform hover:scale-105 transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #FF6348 0%, #FFD93D 100%)',
              border: '4px solid #FFD93D',
              boxShadow: '0 8px 20px rgba(255, 217, 61, 0.3)'
            }}
          >
            <div className="text-6xl mb-4">🤔</div>
            <h2 className="text-3xl font-bold text-white mb-2">Medium</h2>
            <p className="text-xl text-white opacity-90">Normal speed</p>
          </button>

          <button
            onClick={() => startGame('hard')}
            className="difficulty-card p-8 rounded-3xl transform hover:scale-105 transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #FF4757 0%, #FF6348 100%)',
              border: '4px solid #FFD93D',
              boxShadow: '0 8px 20px rgba(255, 71, 87, 0.3)'
            }}
          >
            <div className="text-6xl mb-4">🧐</div>
            <h2 className="text-3xl font-bold text-white mb-2">Hard</h2>
            <p className="text-xl text-white opacity-90">Fast speed</p>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="pattern-game p-8">
      <div className="game-header mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4" style={{ color: '#FF4757' }}>
          Pattern Game - {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </h1>
        <div className="stats flex gap-8 justify-center text-2xl">
          <div className="stat" style={{ color: '#FFD93D', fontWeight: 'bold' }}>
            Level: {level}
          </div>
          <div className="stat" style={{ color: '#FF4757', fontWeight: 'bold' }}>
            Score: {score}
          </div>
          <div className="stat" style={{ color: '#FF6348', fontWeight: 'bold' }}>
            {isShowingPattern ? '👀 Watch!' : '🎮 Your Turn!'}
          </div>
        </div>
      </div>

      <div className="patterns-grid max-w-2xl mx-auto mb-8">
        <div className="grid grid-cols-2 gap-6">
          {patterns.map((pattern, index) => (
            <button
              key={pattern.id}
              onClick={() => handlePatternClick(index)}
              disabled={isShowingPattern}
              className="pattern-button aspect-square rounded-3xl flex flex-col items-center justify-center text-8xl transform transition-all duration-200"
              style={{
                background: activePattern === index
                  ? 'linear-gradient(135deg, #FFD93D 0%, #FF6348 100%)'
                  : 'linear-gradient(135deg, #FF4757 0%, #FF6348 100%)',
                border: '4px solid #FFD93D',
                boxShadow: activePattern === index
                  ? '0 0 30px rgba(255, 217, 61, 0.8)'
                  : '0 4px 15px rgba(255, 71, 87, 0.3)',
                transform: activePattern === index ? 'scale(1.1)' : 'scale(1)',
                cursor: isShowingPattern ? 'not-allowed' : 'pointer',
                opacity: isShowingPattern ? 0.7 : 1
              }}
            >
              {pattern.emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="sequence-display mb-8 text-center">
        <div className="flex justify-center gap-2">
          {sequence.map((_, index) => (
            <div
              key={index}
              className="sequence-dot w-4 h-4 rounded-full"
              style={{
                background: index < playerSequence.length
                  ? '#FFD93D'
                  : '#ccc',
                border: '2px solid #FF4757'
              }}
            />
          ))}
        </div>
      </div>

      <div className="controls text-center">
        <button
          onClick={() => setDifficulty(null)}
          className="px-8 py-4 text-2xl font-bold rounded-full transform hover:scale-105 transition-all"
          style={{
            background: 'linear-gradient(135deg, #FFD93D 0%, #FF4757 100%)',
            color: 'white',
            border: '3px solid #FFD93D',
            boxShadow: '0 4px 10px rgba(255, 71, 87, 0.3)'
          }}
        >
          ← Back to Menu
        </button>
      </div>
    </div>
  )
}
