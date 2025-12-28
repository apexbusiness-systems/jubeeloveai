/**
 * Authentication System Regression Guard
 * 
 * Monitors authentication state, session validity, and role consistency
 * to prevent auth-related bugs.
 */

import { isSupabaseConfigured, supabase, supabaseConfigError } from '@/integrations/supabase/client'
import { logger as _logger } from '../logger'
import type { HealthCheckResult } from '../systemHealthCheck'

/**
 * Run authentication system health checks
 */
export async function runAuthHealthCheck(): Promise<HealthCheckResult[]> {
  const results: HealthCheckResult[] = []
  const timestamp = Date.now()
  
  // Check 1: Supabase client initialization
  if (!isSupabaseConfigured) {
    results.push({
      passed: false,
      system: 'SupabaseClient',
      message: supabaseConfigError ?? 'Supabase client is not configured',
      severity: 'critical',
      autoFixed: false,
      timestamp
    })
    return results
  }

  results.push({
    passed: true,
    system: 'SupabaseClient',
    message: 'Supabase client is initialized',
    severity: 'info',
    autoFixed: false,
    timestamp
  })
  
  // Check 2: Session validity
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      results.push({
        passed: false,
        system: 'AuthSession',
        message: `Session check failed: ${error.message}`,
        severity: 'warning',
        autoFixed: false,
        timestamp
      })
    } else if (session) {
      // Check if session is about to expire (within 5 minutes)
      const expiresAt = session.expires_at
      if (expiresAt) {
        const expiresIn = expiresAt - Math.floor(Date.now() / 1000)
        if (expiresIn < 300) {
          results.push({
            passed: false,
            system: 'AuthSession',
            message: `Session expires in ${Math.floor(expiresIn / 60)} minutes`,
            severity: 'warning',
            autoFixed: false,
            timestamp
          })
        } else {
          results.push({
            passed: true,
            system: 'AuthSession',
            message: 'Active session is valid',
            severity: 'info',
            autoFixed: false,
            timestamp
          })
        }
      }
    } else {
      results.push({
        passed: true,
        system: 'AuthSession',
        message: 'No active session (expected for non-parent views)',
        severity: 'info',
        autoFixed: false,
        timestamp
      })
    }
  } catch (error) {
    results.push({
      passed: false,
      system: 'AuthSession',
      message: `Session validation failed: ${error}`,
      severity: 'warning',
      autoFixed: false,
      timestamp
    })
  }
  
  // Check 3: Auth state listener
  try {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {})
    
    if (subscription) {
      subscription.unsubscribe()
      results.push({
        passed: true,
        system: 'AuthStateListener',
        message: 'Auth state change listener is functional',
        severity: 'info',
        autoFixed: false,
        timestamp
      })
    } else {
      results.push({
        passed: false,
        system: 'AuthStateListener',
        message: 'Auth state listener failed to subscribe',
        severity: 'warning',
        autoFixed: false,
        timestamp
      })
    }
  } catch (error) {
    results.push({
      passed: false,
      system: 'AuthStateListener',
      message: `Auth listener check failed: ${error}`,
      severity: 'warning',
      autoFixed: false,
      timestamp
    })
  }
  
  return results
}
