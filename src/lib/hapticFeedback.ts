/**
 * Haptic Feedback Utility
 * Provides vibration feedback for touch interactions on supported devices
 */

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error';

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 10],
  error: [20, 50, 20, 50, 20],
};

/**
 * Checks if the device supports vibration
 */
export const isHapticSupported = (): boolean => {
  return 'vibrate' in navigator;
};

/**
 * Triggers haptic feedback if supported
 */
export const triggerHaptic = (pattern: HapticPattern = 'light'): void => {
  if (!isHapticSupported()) return;
  
  try {
    const vibrationPattern = patterns[pattern];
    navigator.vibrate(vibrationPattern);
  } catch (error) {
    console.warn('Haptic feedback failed:', error);
  }
};

/**
 * Cancels any ongoing vibration
 */
export const cancelHaptic = (): void => {
  if (isHapticSupported()) {
    navigator.vibrate(0);
  }
};

/**
 * React hook for haptic feedback
 */
export const useHapticFeedback = () => {
  const supported = isHapticSupported();

  return {
    supported,
    trigger: triggerHaptic,
    cancel: cancelHaptic,
  };
};
