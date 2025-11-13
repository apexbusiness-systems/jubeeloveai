/**
 * Jubee Error Recovery System
 *
 * Proactive error detection and graceful recovery.
 * Ensures Jubee never breaks, always recovers gracefully.
 */

import { getContainerDimensions, getViewportBounds } from './JubeeDom'

export type RecoveryAction = 'none' | 'position_reset' | 'animation_reset' | 'full_reset' | 'force_visibility'

export interface HealthCheck {
  isHealthy: boolean
  issues: string[]
  recommendedAction: RecoveryAction
}

interface JubeeState {
  containerPosition: { bottom: number; right: number }
  position: { x: number; y: number; z: number }
  isDragging: boolean
  isVisible: boolean
  currentAnimation: string
  [key: string]: unknown
}

type StateUpdater = (updates: Partial<JubeeState>) => void

/**
 * Comprehensive health check
 */
export function performHealthCheck(state: {
  containerPosition: { bottom: number; right: number }
  position: { x: number; y: number; z: number }
  isDragging: boolean
  isVisible: boolean
  currentAnimation: string
}): HealthCheck {
  const issues: string[] = []
  let recommendedAction: RecoveryAction = 'none'

  // Check viewport clipping
  const viewport = getViewportBounds()
  const containerDims = getContainerDimensions()
  const absoluteLeft = viewport.width - state.containerPosition.right - containerDims.width
  const absoluteTop = viewport.height - state.containerPosition.bottom - containerDims.height

  if (absoluteLeft < 0 || absoluteTop < 0 ||
      state.containerPosition.right < 0 || state.containerPosition.bottom < 0) {
    issues.push('Container position out of bounds')
    recommendedAction = 'position_reset'
  }

  // Check canvas position
  const canvasBounds = {
    x: { min: -5.5, max: 5.5 },
    y: { min: -3.5, max: 1.2 },
    z: { min: -2, max: 2 }
  }

  if (state.position.x < canvasBounds.x.min || state.position.x > canvasBounds.x.max ||
      state.position.y < canvasBounds.y.min || state.position.y > canvasBounds.y.max ||
      state.position.z < canvasBounds.z.min || state.position.z > canvasBounds.z.max) {
    issues.push('Canvas position out of bounds')
    if (recommendedAction === 'none') {
      recommendedAction = 'position_reset'
    }
  }

  // Check visibility
  if (!state.isVisible && !state.isDragging) {
    issues.push('Jubee is invisible')
    recommendedAction = 'force_visibility'
  }

  // Check for stuck animation
  const validAnimations = ['idle', 'excited', 'celebrate', 'pageTransition']
  if (!validAnimations.includes(state.currentAnimation)) {
    issues.push('Invalid animation state')
    recommendedAction = 'animation_reset'
  }

  return {
    isHealthy: issues.length === 0,
    issues,
    recommendedAction
  }
}

/**
 * Execute recovery action
 */
export function executeRecovery(
  action: RecoveryAction,
  setState: StateUpdater
): void {
  console.log('[Jubee Recovery] Executing:', action)

  switch (action) {
    case 'position_reset':
      setState({
        containerPosition: { bottom: 200, right: 100 },
        position: { x: 2.5, y: -1.5, z: 0 }
      })
      console.log('[Jubee Recovery] Position reset complete')
      break

    case 'animation_reset':
      setState({
        currentAnimation: 'idle'
      })
      console.log('[Jubee Recovery] Animation reset complete')
      break

    case 'force_visibility':
      setState({
        isVisible: true
      })
      console.log('[Jubee Recovery] Visibility restored')
      break

    case 'full_reset':
      setState({
        containerPosition: { bottom: 200, right: 100 },
        position: { x: 2.5, y: -1.5, z: 0 },
        currentAnimation: 'idle',
        isVisible: true,
        isDragging: false
      })
      console.log('[Jubee Recovery] Full reset complete')
      break

    case 'none':
      // No action needed
      break
  }
}

/**
 * Proactive validation before state changes
 */
export function validateStateChange(
  currentState: JubeeState,
  proposedChanges: Partial<JubeeState>
): { valid: boolean; safeChanges: Partial<JubeeState> } {
  const safeChanges = { ...proposedChanges }

  // Validate position changes
  if (proposedChanges.containerPosition) {
    const viewport = getViewportBounds()
    const containerDims = getContainerDimensions()

    const pos = proposedChanges.containerPosition
    const minRight = 20
    const maxRight = viewport.width - containerDims.width - 20
    const minBottom = 20
    const maxBottom = viewport.height - containerDims.height - 20

    safeChanges.containerPosition = {
      right: Math.max(minRight, Math.min(maxRight, pos.right)),
      bottom: Math.max(minBottom, Math.min(maxBottom, pos.bottom))
    }
  }

  // Validate animation changes
  if (proposedChanges.currentAnimation) {
    const validAnimations = ['idle', 'excited', 'celebrate', 'pageTransition']
    if (!validAnimations.includes(proposedChanges.currentAnimation)) {
      console.warn('[Jubee Validation] Invalid animation rejected:', proposedChanges.currentAnimation)
      safeChanges.currentAnimation = 'idle'
    }
  }

  return {
    valid: true,
    safeChanges
  }
}
