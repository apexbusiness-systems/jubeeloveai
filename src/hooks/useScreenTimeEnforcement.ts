import { useEffect, useState, useCallback, useRef } from 'react';
import { useParentalStore } from '@/store/useParentalStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ScreenTimeStatus {
  isWithinSchedule: boolean;
  remainingMinutes: number;
  isLimitReached: boolean;
  shouldWarn: boolean;
  currentSession: {
    startTime: number;
    elapsedSeconds: number;
  } | null;
}

export function useScreenTimeEnforcement() {
  const { 
    activeChildId, 
    children, 
    updateSessionTime,
    endSession 
  } = useParentalStore();
  
  const [status, setStatus] = useState<ScreenTimeStatus>({
    isWithinSchedule: true,
    remainingMinutes: 0,
    isLimitReached: false,
    shouldWarn: false,
    currentSession: null,
  });

  const activeChild = children.find(c => c.id === activeChildId);
  const alertSentRef = useRef<Set<number>>(new Set());

  // Send email alert to parent
  const sendEmailAlert = useCallback(async (alertType: 'approaching_limit' | 'time_request', data: any) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user?.email) return;

      await supabase.functions.invoke('send-screen-time-alert', {
        body: {
          parentEmail: user.email,
          childName: activeChild?.name,
          alertType,
          ...data,
        },
      });
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }, [activeChild]);

  // Check if current time is within allowed schedule
  const checkSchedule = useCallback((): boolean => {
    if (!activeChild) return true;
    
    const settings = activeChild.settings as any;
    if (!settings?.enforceSchedule || !settings?.schedules?.length) {
      return true; // No schedule restrictions
    }

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Check if current time falls within any allowed schedule
    return settings.schedules.some((schedule: any) => {
      if (schedule.day !== currentDay) return false;
      
      const [startHour, startMin] = schedule.startTime.split(':').map(Number);
      const [endHour, endMin] = schedule.endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      return currentTime >= startMinutes && currentTime < endMinutes;
    });
  }, [activeChild]);

  // Calculate remaining time
  const calculateRemaining = useCallback((): number => {
    if (!activeChild) return 0;
    
    const limitSeconds = activeChild.dailyTimeLimit * 60;
    const usedSeconds = activeChild.totalTimeToday;
    const remainingSeconds = Math.max(0, limitSeconds - usedSeconds);
    
    return Math.floor(remainingSeconds / 60);
  }, [activeChild]);

  // Update status every 10 seconds instead of every second for better performance
  useEffect(() => {
    if (!activeChild || !activeChildId) {
      setStatus({
        isWithinSchedule: true,
        remainingMinutes: 0,
        isLimitReached: false,
        shouldWarn: false,
        currentSession: null,
      });
      return;
    }

    const updateStatus = () => {
      const isWithinSchedule = checkSchedule();
      const remainingMinutes = calculateRemaining();
      const isLimitReached = remainingMinutes <= 0;
      const shouldWarn = remainingMinutes <= 5 && remainingMinutes > 0;

      setStatus({
        isWithinSchedule,
        remainingMinutes,
        isLimitReached,
        shouldWarn,
        currentSession: activeChild.sessionStartTime ? {
          startTime: activeChild.sessionStartTime,
          elapsedSeconds: Math.floor((Date.now() - activeChild.sessionStartTime) / 1000),
        } : null,
      });

      // Update session time in store (only check limits, not every second)
      const canContinue = updateSessionTime();
      
      // Show warnings and send email alerts
      if (!isWithinSchedule) {
        toast({
          title: "Outside Allowed Hours",
          description: "This time is outside the allowed schedule. Session will end soon.",
          variant: "destructive",
        });
        setTimeout(() => endSession(), 3000);
      } else if (isLimitReached && canContinue === false) {
        toast({
          title: "Time Limit Reached",
          description: `${activeChild.name} has reached today's screen time limit.`,
          variant: "destructive",
        });
        endSession();
      } else if (shouldWarn) {
        toast({
          title: "Time Running Low",
          description: `Only ${remainingMinutes} minutes remaining today!`,
        });
        
        // Send email alert at 10 and 5 minutes (only once per threshold)
        if ((remainingMinutes === 10 || remainingMinutes === 5) && !alertSentRef.current.has(remainingMinutes)) {
          alertSentRef.current.add(remainingMinutes);
          sendEmailAlert('approaching_limit', { remainingMinutes });
        }
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 10000); // Changed from 1000ms to 10000ms

    return () => clearInterval(interval);
  }, [activeChild, activeChildId, checkSchedule, calculateRemaining, updateSessionTime, endSession, sendEmailAlert]);

  // Sync session to database
  const syncSessionToDatabase = useCallback(async () => {
    if (!activeChild || !activeChild.sessionStartTime) return;

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const durationSeconds = Math.floor((Date.now() - activeChild.sessionStartTime) / 1000);

    try {
      await supabase.from('usage_sessions').insert({
        user_id: user.id,
        child_profile_id: activeChild.id,
        session_start: new Date(activeChild.sessionStartTime).toISOString(),
        session_end: new Date().toISOString(),
        duration_seconds: durationSeconds,
      });
    } catch (error) {
      console.error('Failed to sync session:', error);
    }
  }, [activeChild]);

  // Sync when session ends
  useEffect(() => {
    return () => {
      syncSessionToDatabase();
    };
  }, [syncSessionToDatabase]);

  // Request more time function
  const requestMoreTime = useCallback(async (requestedMinutes: number) => {
    if (!activeChild) return;

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      await supabase.from('screen_time_requests').insert({
        user_id: user.id,
        child_profile_id: activeChild.id,
        requested_minutes: requestedMinutes,
        status: 'pending',
      });

      // Send email notification to parent
      await sendEmailAlert('time_request', { requestedMinutes });

      toast({
        title: "Request Sent!",
        description: `Your request for ${requestedMinutes} more minutes has been sent to your parent.`,
      });
    } catch (error) {
      console.error('Failed to request more time:', error);
      toast({
        title: "Request Failed",
        description: "Could not send your request. Please try again.",
        variant: "destructive",
      });
    }
  }, [activeChild, sendEmailAlert]);

  return {
    status,
    requestMoreTime,
    forceEndSession: () => {
      syncSessionToDatabase();
      endSession();
    },
  };
}
