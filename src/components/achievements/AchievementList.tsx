import { useMemo, memo } from 'react'
import { Achievement } from '@/types/achievements'
import { AchievementBadge } from './AchievementBadge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Props {
  achievements: Achievement[]
}

// Memoized achievement badge wrapper
const MemoizedAchievementBadge = memo(AchievementBadge)

export function AchievementList({ achievements }: Props) {
  // Memoize categorization to avoid recalculation on every render
  const categories = useMemo(() => ({
    all: achievements,
    activity: achievements.filter(a => a.category === 'activity'),
    streak: achievements.filter(a => a.category === 'streak'),
    milestone: achievements.filter(a => a.category === 'milestone'),
    special: achievements.filter(a => a.category === 'special')
  }), [achievements])

  // Memoize earned count
  const earnedCount = useMemo(
    () => achievements.filter(a => a.earned).length,
    [achievements]
  )

  // Memoize sorting function O(n log n)
  const sortAchievements = useMemo(() => {
    return (achievementList: Achievement[]) => {
      return [...achievementList].sort((a, b) => {
        if (a.earned && !b.earned) return -1
        if (!a.earned && b.earned) return 1
        return b.progress - a.progress
      })
    }
  }, [])

  const renderAchievements = (achievementList: Achievement[]) => {
    if (achievementList.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No achievements in this category yet
        </div>
      )
    }

    const sorted = sortAchievements(achievementList)

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map(achievement => (
          <MemoizedAchievementBadge key={achievement.id} achievement={achievement} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Your Achievements</h2>
          <p className="text-muted-foreground">
            {earnedCount} of {achievements.length} achievements unlocked
          </p>
        </div>
        <div className="text-4xl">
          {earnedCount === achievements.length ? '🏆' : '🎯'}
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            All ({categories.all.length})
          </TabsTrigger>
          <TabsTrigger value="activity">
            🎯 Activity
          </TabsTrigger>
          <TabsTrigger value="streak">
            🔥 Streak
          </TabsTrigger>
          <TabsTrigger value="milestone">
            ⭐ Milestone
          </TabsTrigger>
          <TabsTrigger value="special">
            💎 Special
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {renderAchievements(categories.all)}
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          {renderAchievements(categories.activity)}
        </TabsContent>

        <TabsContent value="streak" className="mt-6">
          {renderAchievements(categories.streak)}
        </TabsContent>

        <TabsContent value="milestone" className="mt-6">
          {renderAchievements(categories.milestone)}
        </TabsContent>

        <TabsContent value="special" className="mt-6">
          {renderAchievements(categories.special)}
        </TabsContent>
      </Tabs>
    </div>
  )
}
