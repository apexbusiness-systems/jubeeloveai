/**
 * Jubee Rendering Guard
 * 
 * Prevents rendering regressions through comprehensive validation,
 * monitoring, and automatic recovery mechanisms.
 */

import { logger } from '@/lib/logger';

interface RenderState {
  containerExists: boolean;
  canvasExists: boolean;
  webglContextValid: boolean;
  isInViewport: boolean;
  hasValidDimensions: boolean;
  lastRenderTimestamp: number;
}

interface GuardConfig {
  maxRecoveryAttempts: number;
  recoveryTimeout: number;
  healthCheckInterval: number;
}

const DEFAULT_CONFIG: GuardConfig = {
  maxRecoveryAttempts: 3,
  recoveryTimeout: 5000,
  healthCheckInterval: 3000,
};

export class JubeeRenderingGuard {
  private renderState: RenderState = {
    containerExists: false,
    canvasExists: false,
    webglContextValid: false,
    isInViewport: false,
    hasValidDimensions: false,
    lastRenderTimestamp: 0,
  };

  private recoveryAttempts = 0;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private config: GuardConfig;
  private onRecoveryNeeded?: () => void;

  constructor(config?: Partial<GuardConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Validate container element
   */
  validateContainer(container: HTMLElement | null): boolean {
    if (!container) {
      logger.warn('[Rendering Guard] Container element is null');
      this.renderState.containerExists = false;
      return false;
    }

    // Check if container is in DOM
    if (!document.contains(container)) {
      logger.warn('[Rendering Guard] Container not attached to DOM');
      this.renderState.containerExists = false;
      return false;
    }

    // Check container dimensions
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      logger.warn('[Rendering Guard] Container has zero dimensions', rect);
      this.renderState.hasValidDimensions = false;
      return false;
    }

    // Check if container is in viewport
    const isInViewport = (
      rect.top < window.innerHeight &&
      rect.bottom > 0 &&
      rect.left < window.innerWidth &&
      rect.right > 0
    );

    this.renderState.containerExists = true;
    this.renderState.hasValidDimensions = true;
    this.renderState.isInViewport = isInViewport;

    if (!isInViewport) {
      logger.warn('[Rendering Guard] Container outside viewport', rect);
    }

    return true;
  }

  /**
   * Validate canvas element
   */
  validateCanvas(canvas: HTMLCanvasElement | null): boolean {
    if (!canvas) {
      logger.warn('[Rendering Guard] Canvas element is null');
      this.renderState.canvasExists = false;
      return false;
    }

    if (!document.contains(canvas)) {
      logger.warn('[Rendering Guard] Canvas not attached to DOM');
      this.renderState.canvasExists = false;
      return false;
    }

    // Check canvas dimensions
    if (canvas.width === 0 || canvas.height === 0) {
      logger.warn('[Rendering Guard] Canvas has zero dimensions');
      this.renderState.hasValidDimensions = false;
      return false;
    }

    this.renderState.canvasExists = true;
    return true;
  }

  /**
   * Validate WebGL context
   */
  validateWebGLContext(gl: WebGLRenderingContext | null): boolean {
    if (!gl) {
      logger.warn('[Rendering Guard] WebGL context is null');
      this.renderState.webglContextValid = false;
      return false;
    }

    // Check if context is lost
    if (gl.isContextLost()) {
      logger.error('[Rendering Guard] WebGL context is lost');
      this.renderState.webglContextValid = false;
      return false;
    }

    // Verify context is functioning
    try {
      const testParam = gl.getParameter(gl.VERSION);
      if (!testParam) {
        logger.warn('[Rendering Guard] WebGL context not responding');
        this.renderState.webglContextValid = false;
        return false;
      }
    } catch (error) {
      logger.error('[Rendering Guard] WebGL context validation failed', error);
      this.renderState.webglContextValid = false;
      return false;
    }

    this.renderState.webglContextValid = true;
    return true;
  }

  /**
   * Update render timestamp
   */
  recordRender(): void {
    this.renderState.lastRenderTimestamp = Date.now();
  }

  /**
   * Check if rendering is stalled
   */
  isRenderingStalled(): boolean {
    const timeSinceLastRender = Date.now() - this.renderState.lastRenderTimestamp;
    return timeSinceLastRender > 10000; // 10 seconds
  }

  /**
   * Get current render health
   */
  getRenderHealth(): {
    healthy: boolean;
    issues: string[];
    state: RenderState;
  } {
    const issues: string[] = [];

    if (!this.renderState.containerExists) {
      issues.push('Container not found in DOM');
    }

    if (!this.renderState.canvasExists) {
      issues.push('Canvas not found in DOM');
    }

    if (!this.renderState.webglContextValid) {
      issues.push('WebGL context invalid or lost');
    }

    if (!this.renderState.isInViewport) {
      issues.push('Container outside viewport');
    }

    if (!this.renderState.hasValidDimensions) {
      issues.push('Invalid dimensions');
    }

    if (this.isRenderingStalled()) {
      issues.push('Rendering stalled');
    }

    return {
      healthy: issues.length === 0,
      issues,
      state: { ...this.renderState },
    };
  }

  /**
   * Attempt automatic recovery
   */
  attemptRecovery(): boolean {
    if (this.recoveryAttempts >= this.config.maxRecoveryAttempts) {
      logger.error('[Rendering Guard] Max recovery attempts reached');
      return false;
    }

    this.recoveryAttempts++;
    logger.warn(`[Rendering Guard] Attempting recovery (${this.recoveryAttempts}/${this.config.maxRecoveryAttempts})`);

    if (this.onRecoveryNeeded) {
      this.onRecoveryNeeded();
      return true;
    }

    return false;
  }

  /**
   * Reset recovery counter after successful render
   */
  resetRecoveryCounter(): void {
    if (this.recoveryAttempts > 0) {
      logger.info('[Rendering Guard] Recovery successful, resetting counter');
      this.recoveryAttempts = 0;
    }
  }

  /**
   * Start automatic health monitoring
   */
  startHealthMonitoring(
    container: () => HTMLElement | null,
    canvas: () => HTMLCanvasElement | null,
    gl: () => WebGLRenderingContext | null
  ): void {
    if (this.healthCheckTimer) {
      this.stopHealthMonitoring();
    }

    this.healthCheckTimer = setInterval(() => {
      this.validateContainer(container());
      this.validateCanvas(canvas());
      this.validateWebGLContext(gl());

      const health = this.getRenderHealth();
      
      if (!health.healthy) {
        logger.warn('[Rendering Guard] Health check failed', health.issues);
        this.attemptRecovery();
      } else {
        this.resetRecoveryCounter();
      }
    }, this.config.healthCheckInterval);

    logger.info('[Rendering Guard] Health monitoring started');
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      logger.info('[Rendering Guard] Health monitoring stopped');
    }
  }

  /**
   * Set recovery callback
   */
  onRecovery(callback: () => void): void {
    this.onRecoveryNeeded = callback;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.stopHealthMonitoring();
    this.onRecoveryNeeded = undefined;
    this.recoveryAttempts = 0;
  }
}

/**
 * Create singleton instance
 */
export const jubeeRenderingGuard = new JubeeRenderingGuard();
