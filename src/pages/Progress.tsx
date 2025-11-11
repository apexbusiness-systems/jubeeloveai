import { SEO } from '@/components/SEO';
import { useGameStore } from '@/store/useGameStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Award, Target } from 'lucide-react';

export default function ProgressPage() {
  const { score, stickers, completedActivities } = useGameStore();

  const totalActivities = 10; // Writing (10 letters) + Shapes (4) + future modules
  const progressPercentage = (completedActivities.length / totalActivities) * 100;

  return (
    <>
      <SEO 
        title="Jubee Love - My Progress"
        description="Track your learning progress, achievements, and earned rewards with Jubee!"
      />
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <header className="text-center mb-8 pt-4">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">
            My Progress
          </h1>
          <p className="text-primary">
            Keep up the great work! Here's how you're doing.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-4 border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Trophy className="w-6 h-6" />
                Total Score
              </CardTitle>
              <CardDescription className="text-primary">Points earned from all activities</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-bold text-primary">{score}</p>
            </CardContent>
          </Card>

          <Card className="border-4 border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Star className="w-6 h-6" />
                Stickers Collected
              </CardTitle>
              <CardDescription className="text-primary">Unique stickers earned</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-bold text-primary">{stickers.length}</p>
            </CardContent>
          </Card>

          <Card className="border-4 border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Award className="w-6 h-6" />
                Completed Activities
              </CardTitle>
              <CardDescription className="text-primary">Activities you've mastered</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-bold text-primary">{completedActivities.length}</p>
            </CardContent>
          </Card>

          <Card className="border-4 border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Target className="w-6 h-6" />
                Learning Progress
              </CardTitle>
              <CardDescription className="text-primary">Overall completion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-3xl font-bold text-primary">{Math.round(progressPercentage)}%</p>
              <Progress value={progressPercentage} className="h-3" />
            </CardContent>
          </Card>
        </div>

        {stickers.length > 0 && (
          <Card className="border-4 border-primary/30">
            <CardHeader>
              <CardTitle className="text-primary">Your Sticker Collection</CardTitle>
              <CardDescription className="text-primary">Amazing work! Keep collecting!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                {stickers.map((sticker, index) => (
                  <div 
                    key={index}
                    className="aspect-square bg-card rounded-2xl border-4 border-primary/20 flex items-center justify-center text-4xl hover:scale-110 transition-transform"
                  >
                    {sticker}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {completedActivities.length > 0 && (
          <Card className="border-4 border-primary/30">
            <CardHeader>
              <CardTitle className="text-primary">Completed Activities</CardTitle>
              <CardDescription className="text-primary">You've mastered these!</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {completedActivities.map((activity, index) => (
                  <li key={index} className="flex items-center gap-2 text-primary">
                    <Award className="w-5 h-5" />
                    <span className="font-medium capitalize">{activity.replace('-', ' ')}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
