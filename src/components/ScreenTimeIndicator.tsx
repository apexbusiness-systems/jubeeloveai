import { useScreenTimeEnforcement } from '@/hooks/useScreenTimeEnforcement';
import { useParentalStore } from '@/store/useParentalStore';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, Plus } from 'lucide-react';
import { useState } from 'react';

export function ScreenTimeIndicator() {
  const { status, requestMoreTime } = useScreenTimeEnforcement();
  const { activeChildId, children } = useParentalStore();
  const [isRequesting, setIsRequesting] = useState(false);
  
  const activeChild = children.find(c => c.id === activeChildId);
  
  if (!activeChild || !status.currentSession) {
    return null;
  }

  const totalMinutes = activeChild.dailyTimeLimit;
  const usedMinutes = Math.floor(activeChild.totalTimeToday / 60);
  const progressPercent = (usedMinutes / totalMinutes) * 100;

  const handleRequestTime = async () => {
    setIsRequesting(true);
    await requestMoreTime(15); // Request 15 more minutes
    setIsRequesting(false);
  };

  return (
    <Card className="fixed bottom-4 right-4 w-80 p-4 bg-background/95 backdrop-blur border-border shadow-lg z-50">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Screen Time</span>
          </div>
          {status.shouldWarn && (
            <AlertTriangle className="h-4 w-4 text-yellow-500 animate-pulse" />
          )}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Time used today</span>
            <span>{usedMinutes} / {totalMinutes} min</span>
          </div>
          <Progress 
            value={progressPercent} 
            className={`h-2 ${status.shouldWarn ? 'bg-yellow-500/20' : ''}`}
          />
        </div>

        {status.remainingMinutes <= 10 && (
          <div className={`text-xs text-center p-2 rounded-md ${
            status.isLimitReached 
              ? 'bg-destructive/20 text-destructive' 
              : 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
          }`}>
            {status.isLimitReached 
              ? 'Time limit reached!' 
              : `${status.remainingMinutes} minutes remaining`
            }
          </div>
        )}

        {!status.isWithinSchedule && (
          <div className="text-xs text-center p-2 rounded-md bg-destructive/20 text-destructive">
            Outside allowed schedule
          </div>
        )}

        {status.remainingMinutes <= 10 && status.remainingMinutes > 0 && !status.isLimitReached && (
          <Button
            onClick={handleRequestTime}
            disabled={isRequesting}
            variant="outline"
            size="sm"
            className="w-full mt-2"
          >
            <Plus className="h-3 w-3 mr-1" />
            {isRequesting ? 'Sending...' : 'Request 15 More Minutes'}
          </Button>
        )}
      </div>
    </Card>
  );
}
