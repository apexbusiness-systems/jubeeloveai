import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useActivityStore } from '@/store/useActivityStore';

/**
 * Lightweight client-side analytics to power "resume" and "favorites" experiences
 * without any external trackers. Tracks sessions and page visits locally.
 */
export function usePageVisitTracker() {
  const location = useLocation();
  const startSession = useActivityStore((state) => state.startSession);
  const endSession = useActivityStore((state) => state.endSession);
  const recordPageVisit = useActivityStore((state) => state.recordPageVisit);
  const recordActivity = useActivityStore((state) => state.recordActivity);
  const initialPathRef = useRef(location.pathname);

  // Start session on mount and capture the first page
  useEffect(() => {
    startSession();
    recordPageVisit(initialPathRef.current);
    recordActivity();
  }, [recordActivity, recordPageVisit, startSession]);

  // Track page changes
  useEffect(() => {
    recordPageVisit(location.pathname);
    recordActivity();
  }, [location.pathname, recordActivity, recordPageVisit]);

  // Gracefully end sessions when the tab is backgrounded or closed
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        endSession();
      } else {
        startSession();
        recordActivity();
        recordPageVisit(location.pathname);
      }
    };

    const handleBeforeUnload = () => {
      endSession();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [endSession, location.pathname, recordActivity, recordPageVisit, startSession]);
}
