/**
 * Global Error Handlers
 * Catches all unhandled errors and promise rejections
 */

import { logger } from './logger';
import { captureException } from './sentry';

function isExpectedTtsFallbackError(reason: unknown): boolean {
  const message = reason instanceof Error
    ? reason.message
    : typeof reason === 'string' ? reason : '';
  const n = message.toLowerCase();
  return (
    n.includes('all_tts_unavailable') ||
    n.includes('edge function returned 503') ||
    n.includes('status code 503') ||
    n.includes('returned 503') ||
    n.includes('"fallback":"browser"') ||
    n.includes('tts_unavailable_abort')
  );
}

export function initializeGlobalErrorHandlers() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (isExpectedTtsFallbackError(event.reason)) {
      event.preventDefault();
      logger.warn('[Unhandled Promise Rejection] Expected TTS fallback rejection suppressed');
      return;
    }

    event.preventDefault();
    
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    
    logger.error('[Unhandled Promise Rejection]', error);
    
    // Report to Sentry
    captureException(error, {
      type: 'unhandled_rejection',
      reason: event.reason,
    });
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    if (isExpectedTtsFallbackError(event.error || event.message)) {
      event.preventDefault();
      logger.warn('[Uncaught Error] Expected TTS fallback error suppressed');
      return;
    }

    event.preventDefault();
    
    logger.error('[Uncaught Error]', event.error || event.message);
    
    // Report to Sentry
    if (event.error) {
      captureException(event.error, {
        type: 'uncaught_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    }
  });

  // Handle resource loading errors
  window.addEventListener('error', (event) => {
    if (event.target instanceof HTMLImageElement || 
        event.target instanceof HTMLScriptElement ||
        event.target instanceof HTMLLinkElement) {
      
      const target = event.target as HTMLElement;
      const src = target.getAttribute('src') || target.getAttribute('href');
      
      logger.warn('[Resource Load Failed]', {
        tag: target.tagName,
        src,
      });
    }
  }, true);

  logger.info('[Global Error Handlers] Initialized');
}
