/**
 * Jubee State Recovery Hook
 * 
 * Implements checkpoint system and automatic state recovery for Jubee.
 * Enables rollback to known-good states when issues are detected.
 */

import { useEffect, useRef, useCallback } from 'react'
import { useJubeeStore } from '@/store/useJubeeStore'
import { jubeeStateBackupService } from '@/lib/jubeeStateBackup'

interface StateCheckpoint {
  timestamp: number
  containerPosition: { bottom: number; right: number }
  isVisible: boolean
  gender: 'male' | 'female'
  currentAnimation: string
  metadata: {
    renderCount: number
    errorCount: number
    recoveryLevel: number
  }
}

const CHECKPOINT_INTERVAL = 10000 // Create checkpoint every 10 seconds
const MAX_CHECKPOINTS = 10 // Keep last 10 checkpoints
const AUTO_RECOVERY_ENABLED = true

export function useJubeeStateRecovery() {
  const checkpointsRef = useRef<StateCheckpoint[]>([])
  const lastHealthyStateRef = useRef<StateCheckpoint | null>(null)
  const recoveryLevelRef = useRef(0) // 0 = no recovery, 1 = position reset, 2 = full reset

  // Create a state checkpoint
  const createCheckpoint = useCallback(async () => {
    const state = useJubeeStore.getState()
    
    const checkpoint: StateCheckpoint = {
      timestamp: Date.now(),
      containerPosition: { ...state.containerPosition },
      isVisible: state.isVisible,
      gender: state.gender,
      currentAnimation: state.currentAnimation,
      metadata: {
        renderCount: checkpointsRef.current.length,
        errorCount: 0,
        recoveryLevel: recoveryLevelRef.current
      }
    }

    checkpointsRef.current.push(checkpoint)

    // Maintain checkpoint limit
    if (checkpointsRef.current.length > MAX_CHECKPOINTS) {
      checkpointsRef.current.shift()
    }

    // Update last healthy state if system is stable
    if (recoveryLevelRef.current === 0) {
      lastHealthyStateRef.current = checkpoint
      
      // Also create IndexedDB backup for critical checkpoints
      await jubeeStateBackupService.createBackup({
        gender: state.gender,
        voice: state.voice,
        position: state.position,
        containerPosition: state.containerPosition,
        isVisible: state.isVisible,
        currentAnimation: state.currentAnimation
      })
    }

    console.log('[State Recovery] Checkpoint created:', checkpoint.timestamp)
  }, [])

  // Restore state from checkpoint
  const restoreCheckpoint = useCallback((checkpoint: StateCheckpoint) => {
    const { setContainerPosition, triggerAnimation } = useJubeeStore.getState()
    
    console.log('[State Recovery] Restoring checkpoint from', new Date(checkpoint.timestamp).toISOString())
    
    setContainerPosition(checkpoint.containerPosition)
    triggerAnimation(checkpoint.currentAnimation)

    recoveryLevelRef.current = checkpoint.metadata.recoveryLevel + 1
  }, [])

  // Rollback to previous checkpoint
  const rollbackToPreviousState = useCallback((stepsBack: number = 1): boolean => {
    if (checkpointsRef.current.length < stepsBack + 1) {
      console.warn('[State Recovery] Not enough checkpoints for rollback')
      return false
    }

    const targetCheckpoint = checkpointsRef.current[checkpointsRef.current.length - 1 - stepsBack]
    restoreCheckpoint(targetCheckpoint)
    
    return true
  }, [restoreCheckpoint])

  // Restore to last known healthy state
  const restoreLastHealthyState = useCallback(async (): Promise<boolean> => {
    // First try in-memory checkpoint
    if (lastHealthyStateRef.current) {
      console.log('[State Recovery] Restoring from in-memory checkpoint')
      restoreCheckpoint(lastHealthyStateRef.current)
      return true
    }

    // Fallback to IndexedDB backup
    console.log('[State Recovery] No in-memory checkpoint, trying IndexedDB backup')
    const backupState = await jubeeStateBackupService.restoreFromBackup()
    
    if (backupState) {
      const { setContainerPosition, triggerAnimation, setGender, toggleVisibility } = useJubeeStore.getState()
      
      setContainerPosition(backupState.containerPosition)
      triggerAnimation(backupState.currentAnimation)
      setGender(backupState.gender)
      
      if (backupState.isVisible) {
        // Ensure visibility matches
        const { isVisible } = useJubeeStore.getState()
        if (!isVisible) {
          toggleVisibility()
        }
      }
      
      console.log('[State Recovery] Restored from IndexedDB backup')
      return true
    }

    console.warn('[State Recovery] No healthy state or backup available')
    return false
  }, [restoreCheckpoint])

  // Recovery preset: Position only
  const recoverPositionOnly = useCallback(() => {
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const { setContainerPosition } = useJubeeStore.getState()
    
    const safePosition = {
      bottom: Math.min(120, viewportHeight - 500 - 20),
      right: Math.min(80, viewportWidth - 450 - 20)
    }

    console.log('[State Recovery] Position-only recovery:', safePosition)
    setContainerPosition(safePosition)
    recoveryLevelRef.current = 1
  }, [])

  // Recovery preset: Full reset
  const fullReset = useCallback(() => {
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const { setContainerPosition, triggerAnimation, isVisible, toggleVisibility } = useJubeeStore.getState()
    
    const defaultPosition = {
      bottom: Math.min(120, viewportHeight - 500 - 20),
      right: Math.min(80, viewportWidth - 450 - 20)
    }

    console.log('[State Recovery] Full reset initiated')
    setContainerPosition(defaultPosition)
    triggerAnimation('idle')
    
    // Ensure visibility is on
    if (!isVisible) {
      toggleVisibility()
    }
    
    recoveryLevelRef.current = 2
    
    // Reset recovery level after successful reset
    setTimeout(() => {
      recoveryLevelRef.current = 0
    }, 5000)
  }, [])

  // Auto-recovery escalation
  const autoRecover = useCallback((issueType: 'position' | 'render' | 'critical') => {
    if (!AUTO_RECOVERY_ENABLED) return

    console.log('[State Recovery] Auto-recovery triggered for:', issueType)

    switch (issueType) {
      case 'position':
        if (recoveryLevelRef.current < 1) {
          recoverPositionOnly()
        } else {
          rollbackToPreviousState(1)
        }
        break

      case 'render':
        if (recoveryLevelRef.current < 2) {
          restoreLastHealthyState().then((success) => {
            if (!success) {
              fullReset()
            }
          })
        } else {
          fullReset()
        }
        break

      case 'critical':
        fullReset()
        break
    }
  }, [recoverPositionOnly, rollbackToPreviousState, restoreLastHealthyState, fullReset])

  // Periodic checkpoint creation
  useEffect(() => {
    // Create initial checkpoint
    createCheckpoint()

    const intervalId = setInterval(() => {
      createCheckpoint()
    }, CHECKPOINT_INTERVAL)

    return () => clearInterval(intervalId)
  }, [createCheckpoint])

  // Monitor for state issues and auto-recover
  useEffect(() => {
    const unsubscribe = useJubeeStore.subscribe((state, _prevState) => {
      // Detect invalid position (NaN or out of bounds)
      if (
        !Number.isFinite(state.containerPosition.bottom) ||
        !Number.isFinite(state.containerPosition.right)
      ) {
        console.error('[State Recovery] Invalid position detected, auto-recovering')
        autoRecover('position')
      }
    })

    return unsubscribe
  }, [autoRecover])

  return {
    createCheckpoint,
    rollbackToPreviousState,
    restoreLastHealthyState,
    recoverPositionOnly,
    fullReset,
    autoRecover,
    checkpointCount: checkpointsRef.current.length,
    currentRecoveryLevel: recoveryLevelRef.current
  }
}
