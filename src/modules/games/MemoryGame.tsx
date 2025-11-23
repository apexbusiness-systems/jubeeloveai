import { useState, useEffect, useMemo, useCallback, memo } from 'react'
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

const MemoryCard = memo(({
  card, 
  onClick,
  gradient,
  isDisabled
}: { 
  card: Card; 
  onClick: (id: number) => void;
  gradient: string;
  isDisabled: boolean;
}) => (
  <button
    onClick={() => onClick(card.id)}
    disabled={isDisabled || card.isMatched || card.isFlipped}
    className="card aspect-square rounded-2xl flex items-center justify-center text-6xl transform transition-all duration-300 hover:scale-105 border-4 border-game-accent"
    style={{
      background: card.isFlipped || card.isMatched
        ? 'var(--gradient-warm)'
        : gradient,
      boxShadow: 'var(--shadow-game)',
      cursor: card.isMatched ? 'default' : 'pointer',
      opacity: card.isMatched ? 0.6 : 1
    }}
  >
    {(card.isFlipped || card.isMatched) ? card.emoji : '?'}
  </button>
))
MemoryCard.displayName = 'MemoryCard'

export default function MemoryGame() {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [matches, setMatches] = useState(0)
  const { speak, triggerAnimation } = useJubeeStore()
  const { addScore } = useGameStore()

  const initializeGame = useCallback((level: 'easy' | 'medium' | 'hard') => {
    const emojis = emojiSets[level]
    const gameCards: Card[] = []

    // Create pairs
    emojis.forEach((emoji, index) => {
      gameCards.push(
        { id: index * 2, emoji, isFlipped: false, isMatched: false },
        { id: index * 2 + 1, emoji, isFlipped: false, isMatched: false }
      )
    })

    // Shuffle cards - Fisher-Yates for O(n) performance
    for (let i = gameCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [gameCards[i], gameCards[j]] = [gameCards[j], gameCards[i]]
    }
    
    setCards(gameCards)
    setFlippedCards([])
    setMoves(0)
    setMatches(0)
    setDifficulty(level)
    triggerAnimation('excited')
    speak("Let's play memory! Find the matching pairs!")
  }, [triggerAnimation, speak])

  const handleCardClick = useCallback((cardId: number) => {
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
          addScore(20)
          triggerAnimation('celebrate')
          speak("Great match!")

          // Check if game is complete
          const totalPairs = cards.length / 2
          if (matches + 1 === totalPairs) {
            setTimeout(() => {
              addScore(100)
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
  }, [cards, flippedCards, moves, matches, addScore, triggerAnimation, speak])

  // Memoize grid configuration
  const gridConfig = useMemo(() => ({
    columns: 4,
    maxWidth: difficulty === 'easy' ? '600px' : difficulty === 'medium' ? '700px' : '800px'
  }), [difficulty])

  const totalPairs = useMemo(() => cards.length / 2, [cards.length])

  if (!difficulty) {
    return (
      <div className="memory-game-menu p-4 sm:p-6 md:p-8 pt-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-6 md:mb-8 text-game">
          🧠 Memory Match! 🧠
        </h1>
        <p className="text-2xl text-center mb-12 text-game-neutral">
          Find all the matching pairs!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <button
            onClick={() => initializeGame('easy')}
            className="difficulty-card p-8 rounded-3xl transform hover:scale-105 transition-all duration-300 border-4 border-game-accent"
            style={{
              background: 'var(--gradient-warm)',
              boxShadow: 'var(--shadow-game)'
            }}
          >
            <div className="text-6xl mb-4">😊</div>
            <h2 className="text-3xl font-bold text-primary-foreground mb-2">Easy</h2>
            <p className="text-xl text-primary-foreground opacity-90">8 cards (4 pairs)</p>
          </button>

          <button
            onClick={() => initializeGame('medium')}
            className="difficulty-card p-8 rounded-3xl transform hover:scale-105 transition-all duration-300 border-4 border-game-accent"
            style={{
              background: 'var(--gradient-cool)',
              boxShadow: 'var(--shadow-accent)'
            }}
          >
            <div className="text-6xl mb-4">🤔</div>
            <h2 className="text-3xl font-bold text-primary-foreground mb-2">Medium</h2>
            <p className="text-xl text-primary-foreground opacity-90">12 cards (6 pairs)</p>
          </button>

          <button
            onClick={() => initializeGame('hard')}
            className="difficulty-card p-8 rounded-3xl transform hover:scale-105 transition-all duration-300 border-4 border-game-accent"
            style={{
              background: 'var(--gradient-game)',
              boxShadow: 'var(--shadow-game)'
            }}
          >
            <div className="text-6xl mb-4">🧐</div>
            <h2 className="text-3xl font-bold text-primary-foreground mb-2">Hard</h2>
            <p className="text-xl text-primary-foreground opacity-90">16 cards (8 pairs)</p>
          </button>
        </div>
    </div>
  )
}

  return (
    <div className="memory-game p-4 sm:p-6 md:p-8 pt-8">
      <div className="game-header mb-6 md:mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4 text-game">
          Memory Match - {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </h1>
        <div className="stats flex gap-8 justify-center text-2xl">
          <div className="stat text-game-accent font-bold">
            Moves: {moves}
          </div>
          <div className="stat text-game font-bold">
            Matches: {matches}/{totalPairs}
          </div>
        </div>
      </div>

      <div
        className="cards-grid mx-auto mb-8"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridConfig.columns}, 1fr)`,
          gap: '16px',
          maxWidth: gridConfig.maxWidth
        }}
      >
        {cards.map((card) => (
          <MemoryCard
            key={card.id}
            card={card}
            onClick={handleCardClick}
            gradient="var(--gradient-game)"
            isDisabled={flippedCards.length >= 2}
          />
        ))}
      </div>

      <div className="controls text-center">
        <button
          onClick={() => setDifficulty(null)}
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
