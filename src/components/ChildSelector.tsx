import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParentalStore } from '@/store/useParentalStore';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Settings } from 'lucide-react';

interface ChildSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChildSelector({ open, onOpenChange }: ChildSelectorProps) {
  const navigate = useNavigate();
  const { children, startSession } = useParentalStore();

  const handleSelectChild = (childId: string) => {
    startSession(childId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <Users className="w-12 h-12 text-primary" />
          </div>
          <DialogTitle className="text-3xl text-center">Who's Learning Today?</DialogTitle>
          <DialogDescription className="text-lg text-center">
            Select a profile to start learning
          </DialogDescription>
        </DialogHeader>

        {children.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-muted-foreground">No child profiles yet</p>
            <Button
              onClick={() => {
                onOpenChange(false);
                navigate('/parental-controls');
              }}
              variant="outline"
            >
              <Settings className="mr-2 h-5 w-5" />
              Set Up Profiles
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {children.map((child) => (
              <Card
                key={child.id}
                className="cursor-pointer hover:border-primary transition-all transform hover:scale-105 border-2"
                onClick={() => handleSelectChild(child.id)}
              >
                <CardContent className="p-6 text-center space-y-3">
                  <div className="text-6xl">{child.avatar}</div>
                  <div>
                    <h3 className="text-2xl font-bold text-card-foreground">{child.name}</h3>
                    <p className="text-sm text-muted-foreground">Age {child.age}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {Math.floor(child.totalTimeToday / 60)} / {child.dailyTimeLimit} min today
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((child.totalTimeToday / 60 / child.dailyTimeLimit) * 100, 100)}%`
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              navigate('/parental-controls');
            }}
            variant="secondary"
            className="flex-1"
          >
            <Settings className="mr-2 h-5 w-5" />
            Manage Profiles
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
