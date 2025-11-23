import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAuth } from '../useAuth'
import { supabase } from '@/integrations/supabase/client'

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBe(null)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should handle successful session', async () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    const mockSession = { 
      user: mockUser,
      access_token: 'mock-token',
      refresh_token: 'mock-refresh',
      expires_in: 3600,
      token_type: 'bearer',
      expires_at: Date.now() + 3600000
    }
    
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: mockSession as any },
      error: null,
    })

    const { result } = renderHook(() => useAuth())

    // Wait for state to update
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(result.current.loading).toBe(false)
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('should handle signOut', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: null })

    const { result } = renderHook(() => useAuth())

    await result.current.signOut()

    expect(supabase.auth.signOut).toHaveBeenCalled()
  })
})
