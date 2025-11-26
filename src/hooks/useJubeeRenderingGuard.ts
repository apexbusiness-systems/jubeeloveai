/**
 * Jubee Rendering Guard Hook
 * 
 * Integrates rendering guard into React component lifecycle
 * with automatic monitoring and recovery.
 */

import { useEffect, useRef } from 'react';
import { jubeeRenderingGuard } from '@/core/jubee/JubeeRenderingGuard';
import { logger } from '@/lib/logger';

export function useJubeeRenderingGuard(
  containerRef: React.RefObject<HTMLElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  getWebGLContext: () => WebGLRenderingContext | null,
  onRecoveryNeeded: () => void
) {
  const isMonitoringRef = useRef(false);

  // Set up recovery callback
  useEffect(() => {
    jubeeRenderingGuard.onRecovery(onRecoveryNeeded);

    return () => {
      jubeeRenderingGuard.onRecovery(() => {});
    };
  }, [onRecoveryNeeded]);

  // Start health monitoring
  useEffect(() => {
    if (isMonitoringRef.current) {
      return;
    }

    // Wait for refs to be assigned
    if (!containerRef.current || !canvasRef.current) {
      logger.warn('[Rendering Guard Hook] Refs not ready, delaying monitoring');
      return;
    }

    isMonitoringRef.current = true;

    jubeeRenderingGuard.startHealthMonitoring(
      () => containerRef.current,
      () => canvasRef.current,
      getWebGLContext
    );

    logger.info('[Rendering Guard Hook] Monitoring started');

    return () => {
      jubeeRenderingGuard.stopHealthMonitoring();
      isMonitoringRef.current = false;
    };
  }, [containerRef, canvasRef, getWebGLContext]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      jubeeRenderingGuard.cleanup();
    };
  }, []);

  return {
    validateContainer: (container: HTMLElement | null) =>
      jubeeRenderingGuard.validateContainer(container),
    validateCanvas: (canvas: HTMLCanvasElement | null) =>
      jubeeRenderingGuard.validateCanvas(canvas),
    validateWebGL: (gl: WebGLRenderingContext | null) =>
      jubeeRenderingGuard.validateWebGLContext(gl),
    recordRender: () => jubeeRenderingGuard.recordRender(),
    getHealth: () => jubeeRenderingGuard.getRenderHealth(),
  };
}
