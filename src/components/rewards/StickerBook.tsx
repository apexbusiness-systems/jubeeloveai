import { useEffect } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { useJubeeStore } from '../../store/useJubeeStore'

interface Props {
  onClose: () => void
}

interface Sticker {
  id: string
  emoji: string
  name: string
  description: string
  unlockRequirement: number
  category: 'beginner' | 'intermediate' | 'expert'
}

const stickers: Sticker[] = [
  { id: 'bee1', emoji: '🐝', name: 'Happy Bee', description: 'Welcome to Jubee!', unlockRequirement: 0, category: 'beginner' },
  { id: 'flower1', emoji: '🌺', name: 'Pretty Flower', description: 'Complete first activity', unlockRequirement: 50, category: 'beginner' },
  { id: 'star1', emoji: '⭐', name: 'Gold Star', description: 'Earn 100 points', unlockRequirement: 100, category: 'beginner' },
  { id: 'trophy1', emoji: '🏆', name: 'Trophy', description: 'Earn 200 points', unlockRequirement: 200, category: 'beginner' },

  { id: 'butterfly1', emoji: '🦋', name: 'Butterfly', description: 'Earn 300 points', unlockRequirement: 300, category: 'intermediate' },
  { id: 'rainbow1', emoji: '🌈', name: 'Rainbow', description: 'Earn 400 points', unlockRequirement: 400, category: 'intermediate' },
  { id: 'heart1', emoji: '❤️', name: 'Big Heart', description: 'Earn 500 points', unlockRequirement: 500, category: 'intermediate' },
  { id: 'medal1', emoji: '🥇', name: 'Gold Medal', description: 'Earn 600 points', unlockRequirement: 600, category: 'intermediate' },

  { id: 'crown1', emoji: '👑', name: 'Crown', description: 'Earn 700 points', unlockRequirement: 700, category: 'expert' },
  { id: 'diamond1', emoji: '💎', name: 'Diamond', description: 'Earn 800 points', unlockRequirement: 800, category: 'expert' },
  { id: 'rocket1', emoji: '🚀', name: 'Rocket', description: 'Earn 900 points', unlockRequirement: 900, category: 'expert' },
  { id: 'sparkle1', emoji: '✨', name: 'Sparkles', description: 'Earn 1000 points', unlockRequirement: 1000, category: 'expert' }
]

export function StickerBook({ onClose }: Props) {
  const { score, stickers: unlockedStickers, addSticker } = useGameStore()
  const { speak, triggerAnimation } = useJubeeStore()

  // Check for newly unlocked stickers
  useEffect(() => {
    stickers.forEach(sticker => {
      if (score >= sticker.unlockRequirement && !unlockedStickers.includes(sticker.id)) {
        addSticker(sticker.id)
        triggerAnimation('celebrate')
        speak(`New sticker unlocked: ${sticker.name}!`)
      }
    })
  }, [score, unlockedStickers, addSticker, triggerAnimation, speak])

  const getCategoryGradient = (category: string) => {
    switch (category) {
      case 'beginner':
        return 'var(--gradient-beginner)'
      case 'intermediate':
        return 'var(--gradient-intermediate)'
      case 'expert':
        return 'var(--gradient-expert)'
      default:
        return 'var(--gradient-neutral)'
    }
  }

  const getCategoryBorder = (category: string) => {
    switch (category) {
      case 'beginner':
        return 'hsl(var(--beginner-border))'
      case 'intermediate':
        return 'hsl(var(--intermediate-border))'
      case 'expert':
        return 'hsl(var(--expert-border))'
      default:
        return 'hsl(var(--border))'
    }
  }

  const categorizedStickers = {
    beginner: stickers.filter(s => s.category === 'beginner'),
    intermediate: stickers.filter(s => s.category === 'intermediate'),
    expert: stickers.filter(s => s.category === 'expert')
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-3xl p-8 max-w-5xl w-full mx-4 my-8 border-4 border-game-accent"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: 'var(--shadow-elevated)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <h2 className="text-4xl font-bold text-center mb-4 text-game">
          📚 Sticker Collection! 📚
        </h2>

        <p className="text-2xl text-center mb-8 text-game-neutral">
          Collect all {stickers.length} stickers! You have {unlockedStickers.length} so far!
        </p>

        {Object.entries(categorizedStickers).map(([category, categoryStickers]) => (
          <div key={category} className="mb-8">
            <h3
              className="text-3xl font-bold mb-4 capitalize"
              style={{ color: getCategoryBorder(category) }}
            >
              {category} Collection
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {categoryStickers.map((sticker) => {
                const isUnlocked = unlockedStickers.includes(sticker.id)

                return (
                  <div
                    key={sticker.id}
                    className="sticker-card p-6 rounded-2xl transform transition-all duration-300"
                    style={{
                      background: isUnlocked
                        ? getCategoryGradient(category)
                        : 'var(--gradient-neutral)',
                      border: `3px solid ${isUnlocked ? getCategoryBorder(category) : 'hsl(var(--border))'}`,
                      boxShadow: isUnlocked
                        ? `0 6px 15px ${getCategoryBorder(category)}40`
                        : '0 4px 10px hsl(var(--muted) / 0.3)',
                      opacity: isUnlocked ? 1 : 0.5
                    }}
                  >
                    <div className="text-6xl mb-3 text-center">
                      {isUnlocked ? sticker.emoji : '🔒'}
                    </div>
                    <h4
                      className="text-xl font-bold text-center mb-1"
                      style={{ color: isUnlocked ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))' }}
                    >
                      {sticker.name}
                    </h4>
                    <p
                      className="text-sm text-center opacity-90"
                      style={{
                        color: isUnlocked ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))'
                      }}
                    >
                      {isUnlocked ? sticker.description : `${sticker.unlockRequirement} points`}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div className="text-center mt-8">
          <button
            onClick={onClose}
            className="px-8 py-4 text-2xl font-bold rounded-full transform hover:scale-105 transition-all text-primary-foreground border-3 border-game-accent"
            style={{
              background: 'var(--gradient-warm)',
              boxShadow: 'var(--shadow-game)'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
