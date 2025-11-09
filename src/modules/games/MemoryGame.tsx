import { useState, useEffect } from 'react'
import { useJubeeStore } from '../../store/useJubeeStore'
import { useGameStore } from '../../store/useGameStore'

interface Card {
  id: number
  emoji: string
  isFlipped: boolean
  isMatched: boolean
}

const emojiSets = {
  easy: ['🐝', '🦋', '🌻', '🌺'],
  medium: ['🐝', '🦋', '🌻', '🌺', '🌈', '⭐'],
  hard: ['🐝', '🦋', '🌻', '🌺', '🌈', '⭐', '🎨', '🎵']
}

export default function MemoryGame() {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [matches, setMatches] = useState(0)
  const { speak, triggerAnimation } = useJubeeStore()
  const { addPoints } = useGameStore()

  const initializeGame = (level: 'easy' | 'medium' | 'hard') => {
    const emojis = emojiSets[level]
    const gameCards: Card[] = []

    // Create pairs
    emojis.forEach((emoji, index) => {
      gameCards.push(
        { id: index * 2, emoji, isFlipped: false, isMatched: false },
        { id: index * 2 + 1, emoji, isFlipped: false, isMatched: false }
      )
    })

    // Shuffle cards
    const shuffled = gameCards.sort(() => Math.random() - 0.5)
    setCards(shuffled)
    setFlippedCards([])
    setMoves(0)
    setMatches(0)
    setDifficulty(level)
    triggerAnimation('excited')
    speak("Let's play memory! Find the matching pairs!")
  }

  const handleCardClick = (cardId: number) => {
    // Don't allow more than 2 flipped cards or clicking already flipped/matched cards
    if (flippedCards.length >= 2) return
    const card = cards.find(c => c.id === cardId)
    if (!card || card.isFlipped || card.isMatched) return

    const newFlipped = [...flippedCards, cardId]
    setFlippedCards(newFlipped)

    // Flip the card
    setCards(cards.map(c =>
      c.id === cardId ? { ...c, isFlipped: true } : c
    ))

    // Check for match when 2 cards are flipped
    if (newFlipped.length === 2) {
      setMoves(moves + 1)
      const [first, second] = newFlipped
      const firstCard = cards.find(c => c.id === first)
      const secondCard = cards.find(c => c.id === second)

      if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
        // Match found!
        setTimeout(() => {
          setCards(cards.map(c =>
            newFlipped.includes(c.id) ? { ...c, isMatched: true } : c
          ))
          setFlippedCards([])
          setMatches(matches + 1)
          addPoints(20)
          triggerAnimation('celebrate')
          speak("Great match!")

          // Check if game is complete
          const totalPairs = cards.length / 2
          if (matches + 1 === totalPairs) {
            setTimeout(() => {
              addPoints(100)
              triggerAnimation('celebrate')
              speak("You won! Amazing memory!")
              setTimeout(() => setDifficulty(null), 3000)
            }, 500)
          }
        }, 600)
      } else {
        // No match
        setTimeout(() => {
          setCards(cards.map(c =>
            newFlipped.includes(c.id) ? { ...c, isFlipped: false } : c
          ))
          setFlippedCards([])
          speak("Try again!")
        }, 1000)
      }
    }
  }

  if (!difficulty) {
    return (
      <div className="memory-game-menu p-8">
        <h1 className="text-5xl font-bold text-center mb-8" style={{ color: '#FF4757' }}>
          🧠 Memory Match! 🧠
        </h1>
        <p className="text-2xl text-center mb-12 text-gray-700">
          Find all the matching pairs!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <button
            onClick={() => initializeGame('easy')}
            className="difficulty-card p-8 rounded-3xl transform hover:scale-105 transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #FFD93D 0%, #FF6348 100%)',
              border: '4px solid #FFD93D',
              boxShadow: '0 8px 20px rgba(255, 71, 87, 0.3)'
            }}
          >
            <div className="text-6xl mb-4">😊</div>
            <h2 className="text-3xl font-bold text-white mb-2">Easy</h2>
            <p className="text-xl text-white opacity-90">8 cards (4 pairs)</p>
          </button>

          <button
            onClick={() => initializeGame('medium')}
            className="difficulty-card p-8 rounded-3xl transform hover:scale-105 transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #FF6348 0%, #FFD93D 100%)',
              border: '4px solid #FFD93D',
              boxShadow: '0 8px 20px rgba(255, 217, 61, 0.3)'
            }}
          >
            <div className="text-6xl mb-4">🤔</div>
            <h2 className="text-3xl font-bold text-white mb-2">Medium</h2>
            <p className="text-xl text-white opacity-90">12 cards (6 pairs)</p>
          </button>

          <button
            onClick={() => initializeGame('hard')}
            className="difficulty-card p-8 rounded-3xl transform hover:scale-105 transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #FF4757 0%, #FF6348 100%)',
              border: '4px solid #FFD93D',
              boxShadow: '0 8px 20px rgba(255, 71, 87, 0.3)'
            }}
          >
            <div className="text-6xl mb-4">🧐</div>
            <h2 className="text-3xl font-bold text-white mb-2">Hard</h2>
            <p className="text-xl text-white opacity-90">16 cards (8 pairs)</p>
          </button>
        </div>
      </div>
    )
  }

  const totalPairs = cards.length / 2

  return (
    <div className="memory-game p-8">
      <div className="game-header mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4" style={{ color: '#FF4757' }}>
          Memory Match - {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </h1>
        <div className="stats flex gap-8 justify-center text-2xl">
          <div className="stat" style={{ color: '#FFD93D', fontWeight: 'bold' }}>
            Moves: {moves}
          </div>
          <div className="stat" style={{ color: '#FF4757', fontWeight: 'bold' }}>
            Matches: {matches}/{totalPairs}
          </div>
        </div>
      </div>

      <div
        className="cards-grid mx-auto mb-8"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${difficulty === 'easy' ? 4 : difficulty === 'medium' ? 4 : 4}, 1fr)`,
          gap: '16px',
          maxWidth: difficulty === 'easy' ? '600px' : difficulty === 'medium' ? '700px' : '800px'
        }}
      >
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            disabled={card.isMatched || card.isFlipped}
            className="card aspect-square rounded-2xl flex items-center justify-center text-6xl transform transition-all duration-300 hover:scale-105"
            style={{
              background: card.isFlipped || card.isMatched
                ? 'linear-gradient(135deg, #FFD93D 0%, #FF6348 100%)'
                : 'linear-gradient(135deg, #FF4757 0%, #FF6348 100%)',
              border: '4px solid #FFD93D',
              boxShadow: '0 4px 15px rgba(255, 71, 87, 0.3)',
              cursor: card.isMatched ? 'default' : 'pointer',
              opacity: card.isMatched ? 0.6 : 1
            }}
          >
            {(card.isFlipped || card.isMatched) ? card.emoji : '?'}
          </button>
        ))}
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
