/**
 * Production-Safe Logging Utility
 * Prevents sensitive data logging in production
 */

// const IS_PRODUCTION = import.meta.env.PROD;
const IS_DEV = import.meta.env.DEV;

// Sensitive patterns to filter
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /api[_-]?key/i,
  /secret/i,
  /auth/i,
  /pin/i,
  /ssn/i,
  /credit[_-]?card/i,
  /cvv/i,
];

/**
 * Check if data contains sensitive information
 */
function containsSensitiveData(data: unknown): boolean {
  if (typeof data === 'string') {
    return SENSITIVE_PATTERNS.some(pattern => pattern.test(data));
  }
  
  if (typeof data === 'object' && data !== null) {
    return Object.keys(data).some(key => 
      SENSITIVE_PATTERNS.some(pattern => pattern.test(key))
    );
  }
  
  return false;
}

/**
 * Sanitize data for logging
 */
function sanitizeData(data: unknown): unknown {
  if (typeof data === 'object' && data !== null) {
    const sanitized: Record<string, unknown> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (SENSITIVE_PATTERNS.some(pattern => pattern.test(key))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    });
    return sanitized;
  }
  
  return data;
}

/**
 * Safe logger for development
 */
export const logger = {
  /**
   * Development-only logs
   */
  dev: (...args: unknown[]) => {
    if (IS_DEV) {
      console.log('[Dev]', ...args);
    }
  },
  
  /**
   * Info logs (production safe)
   */
  info: (...args: unknown[]) => {
    if (args.some(containsSensitiveData)) {
      console.info('[Info] [Contains sensitive data - redacted]');
      return;
    }
    console.info('[Info]', ...args);
  },
  
  /**
   * Warning logs
   */
  warn: (...args: unknown[]) => {
    const sanitized = args.map(sanitizeData);
    console.warn('[Warning]', ...sanitized);
  },
  
  /**
   * Error logs
   */
  error: (...args: unknown[]) => {
    const sanitized = args.map(sanitizeData);
    console.error('[Error]', ...sanitized);
  },
  
  /**
   * Performance measurement
   */
  time: (label: string) => {
    if (IS_DEV) {
      console.time(`[Perf] ${label}`);
    }
  },
  
  timeEnd: (label: string) => {
    if (IS_DEV) {
      console.timeEnd(`[Perf] ${label}`);
    }
  },
  
  /**
   * Group logs (dev only)
   */
  group: (label: string) => {
    if (IS_DEV) {
      console.group(label);
    }
  },
  
  groupEnd: () => {
    if (IS_DEV) {
      console.groupEnd();
    }
  },
  
  /**
   * Debug information (never in production)
   */
  debug: (...args: unknown[]) => {
    if (IS_DEV) {
      console.debug('[Debug]', ...args);
    }
  },
};

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  
  start(label: string) {
    if (IS_DEV) {
      this.marks.set(label, performance.now());
    }
  }
  
  end(label: string): number | null {
    if (!IS_DEV) return null;
    
    const start = this.marks.get(label);
    if (!start) return null;
    
    const duration = performance.now() - start;
    logger.dev(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    this.marks.delete(label);
    
    return duration;
  }
}

export const perfMonitor = new PerformanceMonitor();
