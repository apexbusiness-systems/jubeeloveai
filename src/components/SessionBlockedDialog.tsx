import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Clock, Lock } from 'lucide-react';

interface SessionBlockedDialogProps {
  open: boolean;
  reason: 'time-limit' | 'schedule';
  childName?: string;
  onRequestMoreTime?: () => void;
}

export function SessionBlockedDialog({ 
  open, 
  reason, 
  childName = 'Child',
  onRequestMoreTime 
}: SessionBlockedDialogProps) {
  const title = reason === 'time-limit' 
    ? "Screen Time Limit Reached" 
    : "Outside Allowed Hours";
  
  const description = reason === 'time-limit'
    ? `${childName} has used all of today's screen time. Time to take a break!`
    : `It's outside the allowed usage schedule. Come back during scheduled hours!`;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            {reason === 'time-limit' ? (
              <Clock className="h-16 w-16 text-primary" />
            ) : (
              <Lock className="h-16 w-16 text-primary" />
            )}
          </div>
          <AlertDialogTitle className="text-center text-2xl">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-lg">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          {reason === 'time-limit' && onRequestMoreTime && (
            <Button variant="outline" onClick={onRequestMoreTime} className="w-full">
              Ask Parent for More Time
            </Button>
          )}
          <Button 
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Return to Home
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
