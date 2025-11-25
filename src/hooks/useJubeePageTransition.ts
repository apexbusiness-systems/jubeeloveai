/**
 * Jubee Page Transition Hook
 * 
 * Animates Jubee flying across the screen during route changes.
 * Creates a smooth, delightful transition effect where Jubee flies
 * from one side of the screen to the other when navigating.
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useJubeeStore } from '@/store/useJubeeStore';
import { getViewportBounds } from '@/core/jubee/JubeeDom';

interface TransitionState {
  isAnimating: boolean;
  startTime: number;
  fromPosition: { bottom: number; right: number };
  toPosition: { bottom: number; right: number };
}

const TRANSITION_DURATION = 800; // ms
const FLY_HEIGHT_OFFSET = 100; // pixels above center

/**
 * Calculate a fly-across trajectory for Jubee
 * Returns intermediate positions for smooth animation
 */
function calculateFlyTrajectory(
  progress: number,
  from: { bottom: number; right: number },
  to: { bottom: number; right: number }
): { bottom: number; right: number } {
  const viewport = getViewportBounds();
  
  // Ease-in-out for smooth acceleration/deceleration
  const easeProgress = progress < 0.5
    ? 2 * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
  
  // Linear interpolation for horizontal movement
  const right = from.right + (to.right - from.right) * easeProgress;
  
  // Parabolic arc for vertical movement (fly up then down)
  const midHeight = Math.max(from.bottom, to.bottom) + FLY_HEIGHT_OFFSET;
  const verticalProgress = Math.sin(progress * Math.PI); // 0 -> 1 -> 0
  const bottom = Math.min(from.bottom, to.bottom) + 
    (midHeight - Math.min(from.bottom, to.bottom)) * verticalProgress;
  
  return { bottom, right };
}

/**
 * Generate random landing position for Jubee after flying
 */
function getRandomLandingPosition(): { bottom: number; right: number } {
  const viewport = getViewportBounds();
  const margin = 100;
  
  // Pick random corner or edge position
  const positions = [
    { bottom: margin + 50, right: margin + 50 }, // bottom-right
    { bottom: viewport.height - margin - 405, right: margin + 50 }, // top-right
    { bottom: margin + 50, right: viewport.width - margin - 360 }, // bottom-left
    { bottom: viewport.height - margin - 405, right: viewport.width - margin - 360 }, // top-left
  ];
  
  return positions[Math.floor(Math.random() * positions.length)];
}

export function useJubeePageTransition() {
  const location = useLocation();
  const { containerPosition, setContainerPosition, isVisible } = useJubeeStore();
  const transitionStateRef = useRef<TransitionState | null>(null);
  const animationFrameRef = useRef<number>();
  const previousPathnameRef = useRef(location.pathname);

  useEffect(() => {
    // Skip animation if Jubee is not visible
    if (!isVisible) return;

    // Skip animation on initial mount
    if (previousPathnameRef.current === location.pathname) {
      previousPathnameRef.current = location.pathname;
      return;
    }

    // Cancel any existing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Start new transition animation
    const fromPosition = { ...containerPosition };
    const toPosition = getRandomLandingPosition();
    
    transitionStateRef.current = {
      isAnimating: true,
      startTime: Date.now(),
      fromPosition,
      toPosition,
    };

    console.log('[Jubee Transition] Starting fly animation from', fromPosition, 'to', toPosition);

    // Animation loop
    const animate = () => {
      const state = transitionStateRef.current;
      if (!state || !state.isAnimating) return;

      const elapsed = Date.now() - state.startTime;
      const progress = Math.min(elapsed / TRANSITION_DURATION, 1);

      // Calculate current position along trajectory
      const currentPosition = calculateFlyTrajectory(
        progress,
        state.fromPosition,
        state.toPosition
      );

      // Update Jubee position
      setContainerPosition(currentPosition);

      // Continue animation or complete
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        console.log('[Jubee Transition] Fly animation complete');
        transitionStateRef.current = null;
      }
    };

    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);

    // Update previous pathname
    previousPathnameRef.current = location.pathname;

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (transitionStateRef.current) {
        transitionStateRef.current.isAnimating = false;
      }
    };
  }, [location.pathname, isVisible, containerPosition, setContainerPosition]);
}
