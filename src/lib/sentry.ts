import * as Sentry from '@sentry/react';
import type { Json } from '@/integrations/supabase/types';

/**
 * Initialize Sentry for error tracking
 * Only runs in production or when VITE_SENTRY_DSN is set
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE;

  // Only initialize if DSN is provided
  if (!dsn) {
    console.info('[Sentry] Not initialized - no DSN provided');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // Session Replay
    replaysSessionSampleRate: environment === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,

    // Filter out non-critical errors
    beforeSend(event, hint) {
      const error = hint.originalException;
      
      // Filter out network errors that are expected
      if (error instanceof Error) {
        if (error.message.includes('NetworkError') || 
            error.message.includes('Failed to fetch')) {
          return null;
        }
      }
      
      return event;
    },

    // Additional context
    initialScope: {
      tags: {
        app_version: import.meta.env.VITE_APP_VERSION || 'unknown',
      },
    },
  });

  console.info('[Sentry] Initialized successfully');
}

/**
 * Capture an exception with additional context
 */
export function captureException(error: Error, context?: Record<string, Json>) {
  if (context) {
    Sentry.setContext('additional', context);
  }
  Sentry.captureException(error);
}

/**
 * Capture a message with level
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; username?: string } | null) {
  Sentry.setUser(user);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
  Sentry.addBreadcrumb(breadcrumb);
}
