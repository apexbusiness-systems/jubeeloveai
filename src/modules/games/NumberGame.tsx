import { useState, useEffect } from 'react'
import { useJubeeStore } from '../../store/useJubeeStore'
import { useGameStore } from '../../store/useGameStore'

interface NumberChallenge {
  question: string
  correctAnswer: number
  options: number[]
  type: 'count' | 'add' | 'subtract'
}

const difficultyLevels = {
  easy: { maxNumber: 5, operations: ['count'] },
  medium: { maxNumber: 10, operations: ['count', 'add'] },
  hard: { maxNumber: 20, operations: ['count', 'add', 'subtract'] }
}

export default function NumberGame() {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null)
  const [challenge, setChallenge] = useState<NumberChallenge | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const { speak, triggerAnimation } = useJubeeStore()
  const { addScore } = useGameStore()

  const generateChallenge = (level: 'easy' | 'medium' | 'hard'): NumberChallenge => {
    const config = difficultyLevels[level]
    const operations = config.operations as ('count' | 'add' | 'subtract')[]
    const type = operations[Math.floor(Math.random() * operations.length)]
    
    if (type === 'count') {
      const count = Math.floor(Math.random() * config.maxNumber) + 1
      const emoji = ['🐝', '⭐', '🌻', '🦋', '🎈'][Math.floor(Math.random() * 5)]
      return {
        question: emoji.repeat(count),
        correctAnswer: count,
        options: generateOptions(count, config.maxNumber),
        type: 'count'
      }
    } else if (type === 'add') {
      const a = Math.floor(Math.random() * (config.maxNumber / 2)) + 1
      const b = Math.floor(Math.random() * (config.maxNumber / 2)) + 1
      const answer = a + b
      return {
        question: `${a} + ${b} = ?`,
        correctAnswer: answer,
        options: generateOptions(answer, config.maxNumber),
        type: 'add'
      }
    } else {
      const b = Math.floor(Math.random() * (config.maxNumber / 2)) + 1
      const a = b + Math.floor(Math.random() * (config.maxNumber / 2)) + 1
      const answer = a - b
      return {
        question: `${a} - ${b} = ?`,
        correctAnswer: answer,
        options: generateOptions(answer, config.maxNumber),
        type: 'subtract'
      }
    }
  }

  const generateOptions = (correct: number, max: number): number[] => {
    const options = new Set([correct])
    while (options.size < 4) {
      const option = Math.max(0, Math.min(max, correct + Math.floor(Math.random() * 7) - 3))
      options.add(option)
    }
    return Array.from(options).sort(() => Math.random() - 0.5)
  }

  const startGame = (level: 'easy' | 'medium' | 'hard') => {
    setDifficulty(level)
    setScore(0)
    setStreak(0)
    setTotalQuestions(0)
    setChallenge(generateChallenge(level))
    triggerAnimation('excited')
    speak("Let's practice numbers! Pick the right answer!")
  }

  const handleAnswer = (answer: number) => {
    if (!challenge || !difficulty) return
    
    setTotalQuestions(prev => prev + 1)
    
    if (answer === challenge.correctAnswer) {
      const points = (difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30) * (streak + 1)
      setScore(prev => prev + points)
      setStreak(prev => prev + 1)
      addScore(points)
      triggerAnimation('celebrate')
      
      const encouragement = [
        "Brilliant! 🌟",
        "You're a math star! ⭐",
        "Perfect! Keep it up! 🎯",
        "Amazing work! 🎉",
        "You're on fire! 🔥"
      ]
      speak(encouragement[Math.floor(Math.random() * encouragement.length)])
      
      setTimeout(() => {
        setChallenge(generateChallenge(difficulty))
      }, 1500)
    } else {
      setStreak(0)
      triggerAnimation('idle')
      speak(`Not quite! The answer was ${challenge.correctAnswer}. Try the next one!`, 'curious')
      
      setTimeout(() => {
        setChallenge(generateChallenge(difficulty))
      }, 2000)
    }
  }

  const endGame = () => {
    if (totalQuestions > 0) {
      const accuracy = Math.round(((totalQuestions - streak) / totalQuestions) * 100)
      speak(`Great job! You scored ${score} points with ${accuracy}% accuracy!`, 'happy')
      addScore(score)
    }
    setDifficulty(null)
    setChallenge(null)
  }

  if (!difficulty) {
    return (
      <div className="number-game-menu p-4 sm:p-6 md:p-8 pt-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-6 md:mb-8 text-game">
          🔢 Number Adventure! 🔢
        </h1>
        <p className="text-2xl text-center mb-12 text-game-neutral">
          Practice counting and math with Jubee!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <button
            onClick={() => startGame('easy')}
            className="difficulty-card p-8 rounded-3xl transform hover:scale-105 transition-all duration-300 border-4 border-game-accent"
            style={{
              background: 'var(--gradient-warm)',
              boxShadow: 'var(--shadow-game)'
            }}
          >
            <div className="text-6xl mb-4">🌱</div>
            <h2 className="text-3xl font-bold text-primary-foreground mb-2">Easy</h2>
            <p className="text-xl text-primary-foreground opacity-90">Count 1-5</p>
          </button>

          <button
            onClick={() => startGame('medium')}
            className="difficulty-card p-8 rounded-3xl transform hover:scale-105 transition-all duration-300 border-4 border-game-accent"
            style={{
              background: 'var(--gradient-cool)',
              boxShadow: 'var(--shadow-accent)'
            }}
          >
            <div className="text-6xl mb-4">🌿</div>
            <h2 className="text-3xl font-bold text-primary-foreground mb-2">Medium</h2>
            <p className="text-xl text-primary-foreground opacity-90">Count & Add to 10</p>
          </button>

          <button
            onClick={() => startGame('hard')}
            className="difficulty-card p-8 rounded-3xl transform hover:scale-105 transition-all duration-300 border-4 border-game-accent"
            style={{
              background: 'var(--gradient-game)',
              boxShadow: 'var(--shadow-game)'
            }}
          >
            <div className="text-6xl mb-4">🌳</div>
            <h2 className="text-3xl font-bold text-primary-foreground mb-2">Hard</h2>
            <p className="text-xl text-primary-foreground opacity-90">Add & Subtract to 20</p>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="number-game p-4 sm:p-6 md:p-8 pt-8 min-h-screen">
      <div className="game-header mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4 text-game">
          Number Adventure - {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
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
        <div className="challenge-area max-w-3xl mx-auto">
          <div 
            className="question-card p-12 rounded-3xl mb-8 text-center border-4 border-game-accent"
            style={{
              background: 'var(--gradient-warm)',
              boxShadow: 'var(--shadow-game)',
              minHeight: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <p className="text-5xl md:text-6xl font-bold text-primary-foreground">
              {challenge.type === 'count' ? (
                <span style={{ letterSpacing: '0.3em' }}>{challenge.question}</span>
              ) : (
                challenge.question
              )}
            </p>
          </div>

          <div className="options grid grid-cols-2 md:grid-cols-4 gap-6">
            {challenge.options.map((option) => (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                className="option-button p-8 rounded-3xl text-4xl font-bold transform hover:scale-110 transition-all duration-200 border-4 border-game-accent"
                style={{
                  background: 'var(--gradient-game)',
                  boxShadow: 'var(--shadow-game)'
                }}
              >
                <span className="text-primary-foreground">{option}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="controls text-center mt-12">
        <button
          onClick={endGame}
          className="px-8 py-4 text-2xl font-bold rounded-full transform hover:scale-105 transition-all text-primary-foreground border-3 border-game-accent"
          style={{
            background: 'var(--gradient-warm)',
            boxShadow: 'var(--shadow-game)'
          }}
        >
          ← Back to Menu
        </button>
      </div>
    </div>
  )
}
