/**
 * Jubee Error Boundary
 * 
 * Catches rendering errors in the mascot component and provides
 * graceful fallback with automatic recovery attempts.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { useJubeeStore } from '@/store/useJubeeStore'
import { jubeeStateBackupService } from '@/lib/jubeeStateBackup'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  recoveryAttempts: number
}

const MAX_RECOVERY_ATTEMPTS = 3
const RECOVERY_DELAY = 2000

export class JubeeErrorBoundary extends Component<Props, State> {
  private recoveryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryAttempts: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Jubee Error Boundary] Caught error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Attempt to restore from backup
    this.attemptRecovery()
  }

  componentWillUnmount() {
    if (this.recoveryTimeoutId) {
      clearTimeout(this.recoveryTimeoutId)
    }
  }

  attemptRecovery = async () => {
    if (this.state.recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
      console.error('[Jubee Error Boundary] Max recovery attempts reached')
      return
    }

    this.setState((prev) => ({
      recoveryAttempts: prev.recoveryAttempts + 1
    }))

    console.log(`[Jubee Error Boundary] Recovery attempt ${this.state.recoveryAttempts + 1}`)

    try {
      // Try to restore from backup
      const backupState = await jubeeStateBackupService.restoreFromBackup()
      
      if (backupState) {
        const { setContainerPosition, triggerAnimation, setGender, toggleVisibility } = useJubeeStore.getState()
        
        setContainerPosition(backupState.containerPosition)
        triggerAnimation('idle')
        setGender(backupState.gender)
        
        if (!backupState.isVisible) {
          toggleVisibility()
        }

        // Reset error state after delay
        this.recoveryTimeoutId = setTimeout(() => {
          this.setState({
            hasError: false,
            error: null,
            errorInfo: null
          })
          console.log('[Jubee Error Boundary] Recovery successful, resetting error state')
        }, RECOVERY_DELAY)
      } else {
        // Fallback: reset to safe defaults
        const { setContainerPosition, triggerAnimation, toggleVisibility } = useJubeeStore.getState()
        const viewportHeight = window.innerHeight
        const viewportWidth = window.innerWidth
        
        setContainerPosition({
          bottom: Math.min(200, viewportHeight - 450 - 20),
          right: Math.min(100, viewportWidth - 400 - 20)
        })
        triggerAnimation('idle')
        
        const { isVisible } = useJubeeStore.getState()
        if (!isVisible) {
          toggleVisibility()
        }

        this.recoveryTimeoutId = setTimeout(() => {
          this.setState({
            hasError: false,
            error: null,
            errorInfo: null
          })
        }, RECOVERY_DELAY)
      }
    } catch (recoveryError) {
      console.error('[Jubee Error Boundary] Recovery failed:', recoveryError)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryAttempts: 0
    })
  }

  render() {
    if (this.state.hasError) {
      // Show fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '400px',
            height: '450px',
            backgroundColor: '#fff',
            border: '2px solid #ff6b6b',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 10000
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🐝</div>
          <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>Jubee Recovery</h3>
          <p style={{ margin: '0 0 16px 0', color: '#666', textAlign: 'center' }}>
            {this.state.recoveryAttempts < MAX_RECOVERY_ATTEMPTS
              ? 'Attempting to recover...'
              : 'Recovery attempts exhausted. Please refresh the page.'}
          </p>
          {this.state.recoveryAttempts >= MAX_RECOVERY_ATTEMPTS && (
            <button
              onClick={this.handleReset}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Try Again
            </button>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

