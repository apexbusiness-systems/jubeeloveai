import { useState, useEffect } from 'react'
import { useJubeeStore } from '../../store/useJubeeStore'
import { useGameStore } from '../../store/useGameStore'

interface Piece {
  id: number
  position: number
  correctPosition: number
}

const puzzleImages = {
  easy: ['🐝', '🦋', '🌻', '🌈'],
  medium: ['🐝', '🦋', '🌻', '🌈', '⭐', '🎈', '🎨', '🎵', '🌺'],
  hard: ['🐝', '🦋', '🌻', '🌈', '⭐', '🎈', '🎨', '🎵', '🌺', '🚀', '🎯', '🎭', '🎪', '🎢', '🎡', '🎠']
}

export default function PuzzleGame() {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null)
  const [pieces, setPieces] = useState<Piece[]>([])
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null)
  const [moves, setMoves] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const { speak, triggerAnimation } = useJubeeStore()
  const { addScore } = useGameStore()

  const initializeGame = (level: 'easy' | 'medium' | 'hard') => {
    const size = level === 'easy' ? 4 : level === 'medium' ? 9 : 16
    const initialPieces: Piece[] = Array.from({ length: size }, (_, i) => ({
      id: i,
      position: i,
      correctPosition: i
    }))
    
    // Shuffle pieces
    const shuffled = [...initialPieces]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = shuffled[i].position
      shuffled[i].position = shuffled[j].position
      shuffled[j].position = temp
    }
    
    setPieces(shuffled)
    setDifficulty(level)
    setMoves(0)
    setIsComplete(false)
    setSelectedPiece(null)
    triggerAnimation('excited')
    speak("Let's solve this puzzle! Tap two pieces to swap them!")
  }

  const handlePieceClick = (pieceId: number) => {
    if (isComplete) return
    
    if (selectedPiece === null) {
      setSelectedPiece(pieceId)
    } else {
      if (selectedPiece === pieceId) {
        setSelectedPiece(null)
        return
      }
      
      // Swap pieces
      setPieces(prev => {
        const newPieces = [...prev]
        const piece1 = newPieces.find(p => p.id === selectedPiece)
        const piece2 = newPieces.find(p => p.id === pieceId)
        
        if (piece1 && piece2) {
          const tempPos = piece1.position
          piece1.position = piece2.position
          piece2.position = tempPos
        }
        
        return newPieces
      })
      
      setMoves(prev => prev + 1)
      setSelectedPiece(null)
    }
  }

  useEffect(() => {
    if (pieces.length === 0 || isComplete) return
    
    const complete = pieces.every(piece => piece.position === piece.correctPosition)
    
    if (complete) {
      setIsComplete(true)
      const bonusPoints = difficulty === 'easy' ? 50 : difficulty === 'medium' ? 100 : 150
      const efficiencyBonus = Math.max(0, 100 - moves * 2)
      const totalPoints = bonusPoints + efficiencyBonus
      
      addScore(totalPoints)
      triggerAnimation('celebrate')
      speak(`Puzzle complete! You solved it in ${moves} moves! Earned ${totalPoints} points! 🎉`)
      
      setTimeout(() => {
        setDifficulty(null)
      }, 3000)
    }
  }, [pieces, isComplete, difficulty, moves, addScore, speak, triggerAnimation])

  if (!difficulty) {
    return (
      <div className="puzzle-game-menu p-4 sm:p-6 md:p-8 pt-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-6 md:mb-8 text-game">
          🧩 Puzzle Master! 🧩
        </h1>
        <p className="text-2xl text-center mb-12 text-game-neutral">
          Put the pieces in the right order!
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
            <div className="text-6xl mb-4">🌟</div>
            <h2 className="text-3xl font-bold text-primary-foreground mb-2">Easy</h2>
            <p className="text-xl text-primary-foreground opacity-90">2×2 Grid (4 pieces)</p>
          </button>

          <button
            onClick={() => initializeGame('medium')}
            className="difficulty-card p-8 rounded-3xl transform hover:scale-105 transition-all duration-300 border-4 border-game-accent"
            style={{
              background: 'var(--gradient-cool)',
              boxShadow: 'var(--shadow-accent)'
            }}
          >
            <div className="text-6xl mb-4">⭐</div>
            <h2 className="text-3xl font-bold text-primary-foreground mb-2">Medium</h2>
            <p className="text-xl text-primary-foreground opacity-90">3×3 Grid (9 pieces)</p>
          </button>

          <button
            onClick={() => initializeGame('hard')}
            className="difficulty-card p-8 rounded-3xl transform hover:scale-105 transition-all duration-300 border-4 border-game-accent"
            style={{
              background: 'var(--gradient-game)',
              boxShadow: 'var(--shadow-game)'
            }}
          >
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-3xl font-bold text-primary-foreground mb-2">Hard</h2>
            <p className="text-xl text-primary-foreground opacity-90">4×4 Grid (16 pieces)</p>
          </button>
        </div>
      </div>
    )
  }

  const gridSize = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4
  const images = puzzleImages[difficulty]

  return (
    <div className="puzzle-game p-4 sm:p-6 md:p-8 pt-8 min-h-screen">
      <div className="game-header mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4 text-game">
          Puzzle Master - {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </h1>
        <div className="text-2xl font-bold text-game-accent mb-4">
          Moves: {moves}
        </div>
        {isComplete && (
          <div className="text-3xl font-bold text-game animate-fade-in">
            🎉 Puzzle Complete! 🎉
          </div>
        )}
      </div>

      <div
        className="puzzle-grid mx-auto mb-8"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gap: '12px',
          maxWidth: difficulty === 'easy' ? '400px' : difficulty === 'medium' ? '500px' : '600px'
        }}
      >
        {pieces
          .sort((a, b) => a.position - b.position)
          .map((piece) => (
            <button
              key={piece.id}
              onClick={() => handlePieceClick(piece.id)}
              disabled={isComplete}
              className={`puzzle-piece aspect-square rounded-2xl flex items-center justify-center text-5xl md:text-6xl transform transition-all duration-300 border-4 ${
                selectedPiece === piece.id ? 'border-game-accent scale-110' : 'border-game-accent/50'
              } ${
                isComplete && piece.position === piece.correctPosition ? 'animate-scale-in' : ''
              }`}
              style={{
                background: selectedPiece === piece.id
                  ? 'var(--gradient-warm)'
                  : 'var(--gradient-game)',
                boxShadow: 'var(--shadow-game)',
                cursor: isComplete ? 'default' : 'pointer'
              }}
            >
              {images[piece.id]}
            </button>
          ))}
      </div>

      <div className="reference-grid mx-auto mb-8 opacity-60">
        <p className="text-center text-xl text-game mb-4 font-bold">Reference:</p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gap: '8px',
            maxWidth: difficulty === 'easy' ? '200px' : difficulty === 'medium' ? '250px' : '300px',
            margin: '0 auto'
          }}
        >
          {images.map((emoji, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg flex items-center justify-center text-2xl md:text-3xl border-2 border-game-accent/30"
              style={{
                background: 'var(--gradient-game)',
                opacity: 0.7
              }}
            >
              {emoji}
            </div>
          ))}
        </div>
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
