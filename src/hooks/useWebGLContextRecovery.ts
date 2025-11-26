/**
 * WebGL Context Recovery Hook
 * 
 * Monitors WebGL context and automatically recovers from context loss.
 * Implements best practices for WebGL context management.
 */

import { useEffect, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface WebGLRecoveryOptions {
  onContextLost?: () => void;
  onContextRestored?: () => void;
  maxRecoveryAttempts?: number;
  recoveryDelay?: number;
}

export function useWebGLContextRecovery(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  options: WebGLRecoveryOptions = {}
) {
  const {
    onContextLost,
    onContextRestored,
    maxRecoveryAttempts = 3,
    recoveryDelay = 1000,
  } = options;

  const recoveryAttemptsRef = useRef(0);
  const isRecoveringRef = useRef(false);
  const contextLostTimeRef = useRef(0);

  /**
   * Handle WebGL context loss
   */
  const handleContextLost = useCallback((event: Event) => {
    event.preventDefault(); // Prevent default behavior
    
    contextLostTimeRef.current = Date.now();
    logger.error('[WebGL Recovery] Context lost', {
      timestamp: contextLostTimeRef.current,
      attempts: recoveryAttemptsRef.current,
    });

    if (onContextLost) {
      onContextLost();
    }

    // Attempt recovery after delay
    setTimeout(() => {
      attemptContextRecovery();
    }, recoveryDelay);
  }, [onContextLost, recoveryDelay]);

  /**
   * Handle WebGL context restoration
   */
  const handleContextRestored = useCallback(() => {
    const recoveryTime = Date.now() - contextLostTimeRef.current;
    logger.info('[WebGL Recovery] Context restored', {
      recoveryTime: `${recoveryTime}ms`,
      attempts: recoveryAttemptsRef.current,
    });

    recoveryAttemptsRef.current = 0;
    isRecoveringRef.current = false;

    if (onContextRestored) {
      onContextRestored();
    }
  }, [onContextRestored]);

  /**
   * Attempt to recover WebGL context
   */
  const attemptContextRecovery = useCallback(() => {
    if (isRecoveringRef.current) return;
    if (recoveryAttemptsRef.current >= maxRecoveryAttempts) {
      logger.error('[WebGL Recovery] Max recovery attempts reached');
      return;
    }

    isRecoveringRef.current = true;
    recoveryAttemptsRef.current++;

    logger.info(`[WebGL Recovery] Attempting recovery (${recoveryAttemptsRef.current}/${maxRecoveryAttempts})`);

    const canvas = canvasRef.current;
    if (!canvas) {
      logger.error('[WebGL Recovery] Canvas ref is null');
      isRecoveringRef.current = false;
      return;
    }

    try {
      // Force WebGL extension to restore context
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl) {
        const loseContext = gl.getExtension('WEBGL_lose_context');
        if (loseContext) {
          loseContext.restoreContext();
          logger.info('[WebGL Recovery] Context restoration triggered');
        }
      }
    } catch (error) {
      logger.error('[WebGL Recovery] Recovery attempt failed', error);
      
      // Retry if attempts remaining
      if (recoveryAttemptsRef.current < maxRecoveryAttempts) {
        setTimeout(() => {
          isRecoveringRef.current = false;
          attemptContextRecovery();
        }, recoveryDelay * recoveryAttemptsRef.current); // Exponential backoff
      }
    }
  }, [canvasRef, maxRecoveryAttempts, recoveryDelay]);

  /**
   * Validate WebGL context health
   */
  const validateContext = useCallback((): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    try {
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return false;

      // Check if context is lost
      if (gl.isContextLost()) {
        logger.warn('[WebGL Recovery] Context is lost');
        return false;
      }

      // Perform basic rendering test
      const testParam = gl.getParameter(gl.VERSION);
      return !!testParam;
    } catch (error) {
      logger.error('[WebGL Recovery] Context validation failed', error);
      return false;
    }
  }, [canvasRef]);

  /**
   * Set up event listeners
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    // Periodic context health check
    const healthCheckInterval = setInterval(() => {
      if (!validateContext() && !isRecoveringRef.current) {
        logger.warn('[WebGL Recovery] Context unhealthy, attempting recovery');
        attemptContextRecovery();
      }
    }, 5000); // Check every 5 seconds

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      clearInterval(healthCheckInterval);
    };
  }, [canvasRef, handleContextLost, handleContextRestored, validateContext, attemptContextRecovery]);

  return {
    validateContext,
    attemptRecovery: attemptContextRecovery,
    isRecovering: isRecoveringRef.current,
    recoveryAttempts: recoveryAttemptsRef.current,
  };
}
