import { logger } from '../lib/logger';

export function initNativePerformanceMonitor() {
  if (!('PerformanceObserver' in window)) {
    logger.info('PerformanceObserver not supported');
    return;
  }

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
      // In production, keep this quiet unless it's a very long task or we have telemetry
      if (entry.duration > 100) {
        logger.dev('Long task detected', {
          name: entry.name,
          duration: entry.duration,
          startTime: entry.startTime
        });
      }
    });
  });

  try {
    observer.observe({ entryTypes: ['longtask', 'navigation', 'resource'], buffered: true });
    logger.dev('Native performance monitor initialized');
  } catch (e) {
    logger.dev('Failed to initialize performance observer types', e);
  }
}
