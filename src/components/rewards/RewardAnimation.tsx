import { useEffect, useState } from 'react'

interface Props {
  show: boolean
  message: string
  emoji?: string
  onComplete?: () => void
}

interface Confetti {
  id: number
  left: number
  delay: number
  duration: number
  emoji: string
}

const celebrationEmojis = ['🎉', '⭐', '✨', '🌟', '💫', '🎊', '🐝', '🌺', '🦋', '🌈']

export function RewardAnimation({ show, message, emoji = '🎉', onComplete }: Props) {
  const [confetti, setConfetti] = useState<Confetti[]>([])

  useEffect(() => {
    if (show) {
      // Generate confetti
      const newConfetti: Confetti[] = []
      for (let i = 0; i < 50; i++) {
        newConfetti.push({
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 0.5,
          duration: 2 + Math.random() * 1,
          emoji: celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)]
        })
      }
      setConfetti(newConfetti)

      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        if (onComplete) {
          onComplete()
        }
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  if (!show) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        animation: 'fadeIn 0.3s ease-in'
      }}
    >
      {/* Confetti */}
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            position: 'absolute',
            left: `${piece.left}%`,
            top: '-10%',
            fontSize: '2rem',
            animation: `fall ${piece.duration}s ease-in ${piece.delay}s forwards`,
            opacity: 0
          }}
        >
          {piece.emoji}
        </div>
      ))}

      {/* Main message */}
      <div
        className="reward-message p-12 rounded-3xl transform border-6 border-game-accent"
        style={{
          background: 'var(--gradient-reward)',
          boxShadow: 'var(--shadow-reward)',
          animation: 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        }}
      >
        <div className="text-9xl mb-6 text-center" style={{
          animation: 'spin 2s linear infinite'
        }}>
          {emoji}
        </div>
        <h2 className="text-5xl font-bold text-primary-foreground text-center mb-4">
          {message}
        </h2>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(-100px);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes fall {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(110vh) rotate(720deg);
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
