import { useEffect } from 'react';
import { useParentalStore } from '@/store/useParentalStore';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export function SessionMonitor() {
  const navigate = useNavigate();
  const { activeChildId, children, updateSessionTime, endSession } = useParentalStore();
  const [showTimeUpDialog, setShowTimeUpDialog] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);

  useEffect(() => {
    if (!activeChildId) return;

    const activeChild = children.find((c) => c.id === activeChildId);
    if (!activeChild || !activeChild.sessionStartTime) return;

    // Check session time every 10 seconds
    const interval = setInterval(() => {
      const timeLimitExceeded = updateSessionTime();
      
      if (timeLimitExceeded === true) {
        setShowTimeUpDialog(true);
        clearInterval(interval);
        return;
      }

      // Warn when 5 minutes left
      const currentSessionTime = Math.floor((Date.now() - activeChild.sessionStartTime!) / 1000);
      const totalTime = activeChild.totalTimeToday + currentSessionTime;
      const timeLeft = (activeChild.dailyTimeLimit * 60) - totalTime;
      
      if (timeLeft <= 300 && timeLeft > 290 && !showWarningDialog) {
        setShowWarningDialog(true);
        toast({
          title: "⏰ 5 Minutes Left!",
          description: `${activeChild.name} has 5 minutes of screen time remaining today.`,
        });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [activeChildId, children, updateSessionTime, showWarningDialog]);

  const activeChild = children.find((c) => c.id === activeChildId);

  if (!activeChild || !activeChild.sessionStartTime) return null;

  const currentSessionTime = Math.floor((Date.now() - activeChild.sessionStartTime) / 1000);
  const totalTime = activeChild.totalTimeToday + currentSessionTime;
  const timeLeftMinutes = Math.floor((activeChild.dailyTimeLimit * 60 - totalTime) / 60);

  return (
    <>
      {/* Time's Up Dialog */}
      <Dialog open={showTimeUpDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <Clock className="w-16 h-16 text-destructive" />
            </div>
            <DialogTitle className="text-3xl text-center">Time's Up!</DialogTitle>
            <DialogDescription className="text-lg text-center">
              {activeChild.name}'s screen time for today is finished. Great job learning!
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total Time Today</p>
              <p className="text-3xl font-bold text-primary">
                {Math.floor(totalTime / 60)} minutes
              </p>
            </div>
            <Button
              onClick={() => {
                endSession();
                setShowTimeUpDialog(false);
                navigate('/');
              }}
              size="lg"
              className="w-full"
            >
              Return to Home
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 5 Minute Warning Dialog */}
      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <AlertTriangle className="w-12 h-12 text-amber-500" />
            </div>
            <DialogTitle className="text-2xl text-center">Time Warning</DialogTitle>
            <DialogDescription className="text-lg text-center">
              {activeChild.name} has {timeLeftMinutes} minute{timeLeftMinutes !== 1 ? 's' : ''} of screen time left today.
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => setShowWarningDialog(false)}
            size="lg"
            className="w-full"
          >
            OK, Got It!
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
