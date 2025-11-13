import { useState, useEffect } from 'react'
import { useJubeeStore } from '../../store/useJubeeStore'
import { useGameStore } from '../../store/useGameStore'

interface LetterChallenge {
  letter: string
  options: string[]
  type: 'uppercase' | 'lowercase' | 'sound'
  correctAnswer: string
}

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export default function AlphabetGame() {
  const [mode, setMode] = useState<'learn' | 'quiz' | null>(null)
  const [challenge, setChallenge] = useState<LetterChallenge | null>(null)
  const [score, setScore] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const { speak, triggerAnimation } = useJubeeStore()
  const { addScore } = useGameStore()

  const generateChallenge = (): LetterChallenge => {
    const letter = alphabet[Math.floor(Math.random() * alphabet.length)]
    const types: ('uppercase' | 'lowercase' | 'sound')[] = ['uppercase', 'lowercase', 'sound']
    const type = types[Math.floor(Math.random() * types.length)]
    
    let correctAnswer = ''
    let options: string[] = []
    
    if (type === 'uppercase') {
      correctAnswer = letter
      options = generateLetterOptions(letter)
    } else if (type === 'lowercase') {
      correctAnswer = letter.toLowerCase()
      const wrongLetters = alphabet.filter(l => l !== letter).slice(0, 3).map(l => l.toLowerCase())
      options = [correctAnswer, ...wrongLetters].sort(() => Math.random() - 0.5)
    } else {
      // Sound matching (starting sound)
      const words = {
        'A': ['🍎 Apple', '🐜 Ant', '🚑 Ambulance'],
        'B': ['🐝 Bee', '🎈 Balloon', '🏀 Ball'],
        'C': ['🐱 Cat', '🚗 Car', '🍰 Cake'],
        'D': ['🐶 Dog', '🦆 Duck', '🚪 Door'],
        'E': ['🥚 Egg', '🐘 Elephant', '👁️ Eye'],
        'F': ['🌸 Flower', '🦊 Fox', '🐟 Fish'],
        'G': ['🍇 Grapes', '🎮 Game', '🎁 Gift'],
        'H': ['🏠 House', '🐴 Horse', '❤️ Heart'],
        'I': ['🍦 Ice cream', '🏝️ Island', '🦎 Iguana'],
        'J': ['🕹️ Joystick', '🧃 Juice', '👖 Jeans'],
        'K': ['🔑 Key', '🦘 Kangaroo', '👑 King'],
        'L': ['🦁 Lion', '🍋 Lemon', '💡 Light'],
        'M': ['🌙 Moon', '🐵 Monkey', '🎵 Music'],
        'N': ['👃 Nose', '🥜 Nut', '🪆 Nest'],
        'O': ['🐙 Octopus', '🍊 Orange', '🦉 Owl'],
        'P': ['🐼 Panda', '🍕 Pizza', '🎨 Paint'],
        'Q': ['👸 Queen', '❓ Question', '🦆 Quack'],
        'R': ['🌈 Rainbow', '🤖 Robot', '🚀 Rocket'],
        'S': ['⭐ Star', '☀️ Sun', '🐍 Snake'],
        'T': ['🌳 Tree', '🐯 Tiger', '🎺 Trumpet'],
        'U': ['☂️ Umbrella', '🦄 Unicorn', '🆙 Up'],
        'V': ['🎻 Violin', '🚐 Van', '🌋 Volcano'],
        'W': ['🌊 Wave', '🐳 Whale', '🪟 Window'],
        'X': ['❌ X-ray', '🎄 Xylophone', '⚔️ X marks'],
        'Y': ['💛 Yellow', '🧘 Yoga', '🤸 Yell'],
        'Z': ['🦓 Zebra', '0️⃣ Zero', '⚡ Zip']
      }
      
      const letterWords = words[letter] || ['Word']
      correctAnswer = letterWords[0]
      
      const wrongOptions = Object.entries(words)
        .filter(([l]) => l !== letter)
        .slice(0, 3)
        .map(([, w]) => w[0])
      
      options = [correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5)
    }
    
    return {
      letter,
      options,
      type,
      correctAnswer
    }
  }

  const generateLetterOptions = (correct: string): string[] => {
    const options = new Set([correct])
    const available = alphabet.filter(l => l !== correct)
    
    while (options.size < 4) {
      const random = available[Math.floor(Math.random() * available.length)]
      options.add(random)
    }
    
    return Array.from(options).sort(() => Math.random() - 0.5)
  }

  const startLearnMode = () => {
    setMode('learn')
    setCurrentIndex(0)
    triggerAnimation('excited')
    speakLetter(alphabet[0])
  }

  const startQuizMode = () => {
    setMode('quiz')
    setScore(0)
    setChallenge(generateChallenge())
    triggerAnimation('excited')
    speak("Let's test your alphabet knowledge! Pick the right answer!")
  }

  const speakLetter = (letter: string) => {
    speak(`${letter}! ${letter} is for... ${getWordForLetter(letter)}`, 'happy')
  }

  const getWordForLetter = (letter: string): string => {
    const words: Record<string, string> = {
      'A': 'Apple', 'B': 'Bee', 'C': 'Cat', 'D': 'Dog', 'E': 'Elephant',
      'F': 'Flower', 'G': 'Grapes', 'H': 'House', 'I': 'Ice cream', 'J': 'Juice',
      'K': 'King', 'L': 'Lion', 'M': 'Moon', 'N': 'Nose', 'O': 'Orange',
      'P': 'Pizza', 'Q': 'Queen', 'R': 'Rainbow', 'S': 'Star', 'T': 'Tree',
      'U': 'Umbrella', 'V': 'Violin', 'W': 'Wave', 'X': 'Xylophone', 'Y': 'Yellow', 'Z': 'Zebra'
    }
    return words[letter] || 'Word'
  }

  const handleNext = () => {
    if (currentIndex < alphabet.length - 1) {
      const next = currentIndex + 1
      setCurrentIndex(next)
      speakLetter(alphabet[next])
      triggerAnimation('excited')
    } else {
      speak("You've learned the whole alphabet! Great job!", 'happy')
      triggerAnimation('celebrate')
      setTimeout(() => setMode(null), 2000)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prev = currentIndex - 1
      setCurrentIndex(prev)
      speakLetter(alphabet[prev])
    }
  }

  const handleAnswer = (answer: string) => {
    if (!challenge) return
    
    if (answer === challenge.correctAnswer) {
      setScore(prev => prev + 20)
      addScore(20)
      triggerAnimation('celebrate')
      speak("Perfect! Well done! ⭐")
      
      setTimeout(() => {
        setChallenge(generateChallenge())
      }, 1500)
    } else {
      triggerAnimation('idle')
      speak(`Not quite! Let's try another one!`, 'curious')
      setTimeout(() => {
        setChallenge(generateChallenge())
      }, 2000)
    }
  }

  if (!mode) {
    return (
      <div className="alphabet-game-menu p-4 sm:p-6 md:p-8 pt-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-6 md:mb-8 text-game">
          🔤 Alphabet Adventure! 🔤
        </h1>
        <p className="text-2xl text-center mb-12 text-game-neutral">
          Learn your ABCs with Jubee!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <button
            onClick={startLearnMode}
            className="mode-card p-12 rounded-3xl transform hover:scale-105 transition-all duration-300 border-4 border-game-accent"
            style={{
              background: 'var(--gradient-warm)',
              boxShadow: 'var(--shadow-game)'
            }}
          >
            <div className="text-7xl mb-4">📚</div>
            <h2 className="text-3xl font-bold text-primary-foreground mb-2">Learn Letters</h2>
            <p className="text-xl text-primary-foreground opacity-90">Explore the alphabet A-Z</p>
          </button>

          <button
            onClick={startQuizMode}
            className="mode-card p-12 rounded-3xl transform hover:scale-105 transition-all duration-300 border-4 border-game-accent"
            style={{
              background: 'var(--gradient-cool)',
              boxShadow: 'var(--shadow-accent)'
            }}
          >
            <div className="text-7xl mb-4">🎯</div>
            <h2 className="text-3xl font-bold text-primary-foreground mb-2">Quiz Mode</h2>
            <p className="text-xl text-primary-foreground opacity-90">Test your knowledge</p>
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'learn') {
    return (
      <div className="alphabet-learn p-4 sm:p-6 md:p-8 pt-8 min-h-screen">
        <h1 className="text-4xl font-bold text-center mb-8 text-game">
          Learn the Alphabet
        </h1>

        <div className="letter-display max-w-2xl mx-auto">
          <div 
            className="letter-card p-16 rounded-3xl text-center mb-8 border-4 border-game-accent"
            style={{
              background: 'var(--gradient-warm)',
              boxShadow: 'var(--shadow-game)'
            }}
          >
            <p className="text-9xl font-bold text-primary-foreground mb-4">
              {alphabet[currentIndex]}
            </p>
            <p className="text-5xl text-primary-foreground opacity-90">
              {alphabet[currentIndex].toLowerCase()}
            </p>
          </div>

          <div className="controls flex gap-6 justify-center mb-8">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="px-8 py-4 text-2xl font-bold rounded-full transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground border-3 border-game-accent"
              style={{
                background: 'var(--gradient-game)',
                boxShadow: 'var(--shadow-game)'
              }}
            >
              ← Previous
            </button>
            <button
              onClick={handleNext}
              className="px-8 py-4 text-2xl font-bold rounded-full transform hover:scale-105 transition-all text-primary-foreground border-3 border-game-accent"
              style={{
                background: 'var(--gradient-game)',
                boxShadow: 'var(--shadow-game)'
              }}
            >
              {currentIndex === alphabet.length - 1 ? 'Finish' : 'Next →'}
            </button>
          </div>

          <button
            onClick={() => setMode(null)}
            className="mx-auto block px-8 py-4 text-2xl font-bold rounded-full transform hover:scale-105 transition-all text-primary-foreground border-3 border-game-accent"
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

  return (
    <div className="alphabet-quiz p-4 sm:p-6 md:p-8 pt-8 min-h-screen">
      <div className="game-header mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4 text-game">
          Alphabet Quiz
        </h1>
        <div className="text-2xl font-bold text-game-accent">
          Score: {score}
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
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <p className="text-3xl text-primary-foreground mb-4">
              {challenge.type === 'uppercase' && 'Find the uppercase letter:'}
              {challenge.type === 'lowercase' && `Find lowercase ${challenge.letter.toLowerCase()}:`}
              {challenge.type === 'sound' && `What starts with ${challenge.letter}?`}
            </p>
            <p className="text-7xl font-bold text-primary-foreground">
              {challenge.type === 'lowercase' ? challenge.letter : challenge.letter}
            </p>
          </div>

          <div className="options grid grid-cols-2 gap-6">
            {challenge.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(option)}
                className="option-button p-8 rounded-3xl text-4xl font-bold transform hover:scale-105 transition-all duration-200 border-4 border-game-accent"
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
          onClick={() => setMode(null)}
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
