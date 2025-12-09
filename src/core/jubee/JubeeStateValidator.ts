/**
 * Jubee State Validator
 * 
 * Validates all state changes before they're applied to prevent
 * invalid states that could cause rendering issues.
 */

import { logger } from '@/lib/logger';
import { getViewportBounds, getContainerDimensions } from './JubeeDom';

export interface ValidationResult<T = unknown> {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedValue?: T;
}

export interface JubeeState {
  containerPosition?: { bottom: number; right: number };
  position?: { x: number; y: number; z: number };
  currentAnimation?: string;
  currentMood?: string;
  isVisible?: boolean;
}

type SanitizedJubeeState = Partial<JubeeState>;

/**
 * Validate container position
 */
export function validateContainerPosition(
  position: { bottom: number; right: number }
): ValidationResult<{ right: number; bottom: number }> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const viewport = getViewportBounds();
  const containerDims = getContainerDimensions();

  // Define safe bounds with margins
  const SAFETY_MARGIN = 20;
  const minRight = SAFETY_MARGIN;
  const maxRight = viewport.width - containerDims.width - SAFETY_MARGIN;
  const minBottom = SAFETY_MARGIN;
  const maxBottom = viewport.height - containerDims.height - SAFETY_MARGIN;

  // Validate and clamp values
  let sanitizedRight = position.right;
  let sanitizedBottom = position.bottom;

  if (position.right < minRight) {
    warnings.push(`Right position ${position.right} below minimum ${minRight}`);
    sanitizedRight = minRight;
  } else if (position.right > maxRight) {
    warnings.push(`Right position ${position.right} exceeds maximum ${maxRight}`);
    sanitizedRight = maxRight;
  }

  if (position.bottom < minBottom) {
    warnings.push(`Bottom position ${position.bottom} below minimum ${minBottom}`);
    sanitizedBottom = minBottom;
  } else if (position.bottom > maxBottom) {
    warnings.push(`Bottom position ${position.bottom} exceeds maximum ${maxBottom}`);
    sanitizedBottom = maxBottom;
  }

  // Check for NaN or invalid numbers
  if (!Number.isFinite(position.right) || !Number.isFinite(position.bottom)) {
    errors.push('Position contains invalid numbers (NaN or Infinity)');
    sanitizedRight = 100;
    sanitizedBottom = 100;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitizedValue: {
      right: sanitizedRight,
      bottom: sanitizedBottom,
    },
  };
}

/**
 * Validate canvas position
 */
export function validateCanvasPosition(
  position: { x: number; y: number; z: number }
): ValidationResult<{ x: number; y: number; z: number }> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Define canvas coordinate bounds
  const BOUNDS = {
    x: { min: -5.5, max: 5.5 },
    y: { min: -3.5, max: 1.2 },
    z: { min: -2, max: 2 },
  };

  let sanitizedX = position.x;
  let sanitizedY = position.y;
  let sanitizedZ = position.z;

  // Validate X
  if (!Number.isFinite(position.x)) {
    errors.push('X position is not a finite number');
    sanitizedX = 0;
  } else if (position.x < BOUNDS.x.min || position.x > BOUNDS.x.max) {
    warnings.push(`X position ${position.x} outside bounds [${BOUNDS.x.min}, ${BOUNDS.x.max}]`);
    sanitizedX = Math.max(BOUNDS.x.min, Math.min(BOUNDS.x.max, position.x));
  }

  // Validate Y
  if (!Number.isFinite(position.y)) {
    errors.push('Y position is not a finite number');
    sanitizedY = 0;
  } else if (position.y < BOUNDS.y.min || position.y > BOUNDS.y.max) {
    warnings.push(`Y position ${position.y} outside bounds [${BOUNDS.y.min}, ${BOUNDS.y.max}]`);
    sanitizedY = Math.max(BOUNDS.y.min, Math.min(BOUNDS.y.max, position.y));
  }

  // Validate Z
  if (!Number.isFinite(position.z)) {
    errors.push('Z position is not a finite number');
    sanitizedZ = 0;
  } else if (position.z < BOUNDS.z.min || position.z > BOUNDS.z.max) {
    warnings.push(`Z position ${position.z} outside bounds [${BOUNDS.z.min}, ${BOUNDS.z.max}]`);
    sanitizedZ = Math.max(BOUNDS.z.min, Math.min(BOUNDS.z.max, position.z));
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitizedValue: {
      x: sanitizedX,
      y: sanitizedY,
      z: sanitizedZ,
    },
  };
}

/**
 * Validate animation state
 */
export function validateAnimation(animation: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const VALID_ANIMATIONS = [
    'idle',
    'excited',
    'celebrate',
    'pageTransition',
    'hover',
    'drag',
  ];

  if (!animation || typeof animation !== 'string') {
    errors.push('Animation must be a non-empty string');
    return {
      valid: false,
      errors,
      warnings,
      sanitizedValue: 'idle',
    };
  }

  if (!VALID_ANIMATIONS.includes(animation)) {
    warnings.push(`Unknown animation "${animation}", falling back to idle`);
    return {
      valid: true,
      errors,
      warnings,
      sanitizedValue: 'idle',
    };
  }

  return {
    valid: true,
    errors,
    warnings,
    sanitizedValue: animation,
  };
}

/**
 * Validate mood state
 */
export function validateMood(
  mood: string
): ValidationResult<string> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const VALID_MOODS = ['happy', 'excited', 'frustrated', 'curious', 'tired'];

  if (!mood || typeof mood !== 'string') {
    errors.push('Mood must be a non-empty string');
    return {
      valid: false,
      errors,
      warnings,
      sanitizedValue: 'happy',
    };
  }

  if (!VALID_MOODS.includes(mood)) {
    warnings.push(`Unknown mood "${mood}", falling back to happy`);
    return {
      valid: true,
      errors,
      warnings,
      sanitizedValue: 'happy',
    };
  }

  return {
    valid: true,
    errors,
    warnings,
    sanitizedValue: mood,
  };
}

/**
 * Validate boolean visibility state
 */
export function validateVisibility(isVisible: unknown): ValidationResult<boolean> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof isVisible !== 'boolean') {
    errors.push(`Visibility must be boolean, got ${typeof isVisible}`);
    return {
      valid: false,
      errors,
      warnings,
      sanitizedValue: true,
    };
  }

  return {
    valid: true,
    errors,
    warnings,
    sanitizedValue: isVisible,
  };
}

/**
 * Comprehensive state validation
 */
export function validateJubeeState(state: JubeeState): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedState: SanitizedJubeeState;
} {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];
  const sanitizedState: SanitizedJubeeState = {};

  // Validate each field if present
  if (state.containerPosition) {
    const result = validateContainerPosition(state.containerPosition);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
    sanitizedState.containerPosition = result.sanitizedValue;
  }

  if (state.position) {
    const result = validateCanvasPosition(state.position);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
    sanitizedState.position = result.sanitizedValue;
  }

  if (state.currentAnimation) {
    const result = validateAnimation(state.currentAnimation);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
    sanitizedState.currentAnimation = result.sanitizedValue;
  }

  if (state.currentMood) {
    const result = validateMood(state.currentMood);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
    sanitizedState.currentMood = result.sanitizedValue;
  }

  if (state.isVisible !== undefined) {
    const result = validateVisibility(state.isVisible);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
    sanitizedState.isVisible = result.sanitizedValue;
  }

  // Log validation results
  if (allErrors.length > 0) {
    logger.error('[State Validator] Validation errors:', allErrors);
  }
  if (allWarnings.length > 0) {
    logger.warn('[State Validator] Validation warnings:', allWarnings);
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    sanitizedState,
  };
}
