import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useActivityStore } from '@/store/useActivityStore';

/**
 * Lightweight client-side analytics to power "resume" and "favorites" experiences
 * without any external trackers. Tracks sessions and page visits locally.
 */
export function usePageVisitTracker() {
  const location = useLocation();
  // ⚡ Bolt Optimization: Grouped Zustand selectors with useShallow to reduce store subscriptions
  const { startSession, endSession, recordPageVisit, recordActivity } = useActivityStore(useShallow(state => ({
    startSession: state.startSession,
    endSession: state.endSession,
    recordPageVisit: state.recordPageVisit,
    recordActivity: state.recordActivity
  })));
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
