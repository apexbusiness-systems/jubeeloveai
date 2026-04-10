import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAchievementStore } from '@/store/useAchievementStore'

export function StreakDisplay() {
  const streakData = useAchievementStore(state => state.streakData);

  const getStreakEmoji = (streak: number) => {
    if (streak === 0) return '⭐'
    if (streak < 3) return '🔥'
    if (streak < 7) return '🔥🔥'
    if (streak < 14) return '🔥🔥🔥'
    return '💎'
  }

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return 'Start your streak today!'
    if (streak === 1) return 'Great start! Come back tomorrow!'
    if (streak < 7) return 'You\'re on fire! Keep it going!'
    if (streak < 14) return 'Amazing streak! You\'re unstoppable!'
    if (streak < 30) return 'Incredible dedication!'
    return 'You\'re a legend!'
  }

  return (
    <Card className="border-2 border-game-accent bg-gradient-to-br from-game-accent/5 to-game-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Daily Streak</span>
          <span className="text-4xl">{getStreakEmoji(streakData.currentStreak)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-6xl font-bold text-game-accent">
            {streakData.currentStreak}
          </div>
          <p className="text-lg text-muted-foreground mt-2">
            {streakData.currentStreak === 1 ? 'day' : 'days'} in a row
          </p>
          <p className="text-sm text-foreground mt-2 font-medium">
            {getStreakMessage(streakData.currentStreak)}
          </p>
        </div>

        {streakData.longestStreak > 0 && (
          <div className="pt-4 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Longest Streak: <span className="font-bold text-foreground">{streakData.longestStreak} days</span>
            </p>
          </div>
        )}

        {streakData.lastActivityDate && (
          <div className="text-xs text-muted-foreground text-center">
            Last activity: {new Date(streakData.lastActivityDate).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
