import { Achievement } from '@/types/achievements'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Props {
  achievement: Achievement
  size?: 'sm' | 'md' | 'lg'
}

export function AchievementBadge({ achievement, size = 'md' }: Props) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'activity':
        return 'bg-game-primary/10 border-game-primary'
      case 'streak':
        return 'bg-game-accent/10 border-game-accent'
      case 'milestone':
        return 'bg-game-secondary/10 border-game-secondary'
      case 'special':
        return 'bg-gradient-to-br from-game-primary to-game-accent border-game-accent'
      default:
        return 'bg-muted border-border'
    }
  }

  const sizeClasses = {
    sm: {
      card: 'p-3',
      emoji: 'text-3xl',
      name: 'text-sm',
      desc: 'text-xs'
    },
    md: {
      card: 'p-4',
      emoji: 'text-5xl',
      name: 'text-base',
      desc: 'text-sm'
    },
    lg: {
      card: 'p-6',
      emoji: 'text-7xl',
      name: 'text-lg',
      desc: 'text-base'
    }
  }

  return (
    <Card
      role="article"
      tabIndex={0}
      aria-label={`${achievement.name}. ${achievement.description}. ${
        achievement.earned
          ? `Earned on ${new Date(achievement.earnedAt!).toLocaleDateString()}.`
          : `${Math.round(achievement.progress)}% complete.`
      }`}
      className={cn(
        'relative overflow-hidden transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        sizeClasses[size].card,
        achievement.earned
          ? `${getCategoryColor(achievement.category)} border-2 hover:shadow-lg hover:scale-105`
          : 'bg-muted/30 border border-border/50 opacity-60'
      )}
    >
      {achievement.earned && (
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="text-xs">
            ✓ Earned
          </Badge>
        </div>
      )}

      <div className="flex flex-col items-center text-center gap-2">
        <div
          className={cn(
            sizeClasses[size].emoji,
            achievement.earned ? 'animate-bounce-slow' : 'grayscale'
          )}
        >
          {achievement.emoji}
        </div>

        <div>
          <h3 className={cn('font-bold text-foreground', sizeClasses[size].name)}>
            {achievement.name}
          </h3>
          <p className={cn('text-muted-foreground', sizeClasses[size].desc)}>
            {achievement.description}
          </p>
        </div>

        {!achievement.earned && achievement.progress > 0 && (
          <div className="w-full space-y-1">
            <Progress value={achievement.progress} className="h-2" aria-label={`${achievement.name} progress`} />
            <p className="text-xs text-muted-foreground">
              {Math.round(achievement.progress)}% complete
            </p>
          </div>
        )}

        {achievement.earnedAt && (
          <p className="text-xs text-muted-foreground">
            Earned {new Date(achievement.earnedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </Card>
  )
}
