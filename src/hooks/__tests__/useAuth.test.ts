import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useAuth } from '../useAuth'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with loading state', async () => {
    vi.mocked(supabase.auth.getSession).mockReturnValueOnce(new Promise(() => {}) as Promise<{
      data: { session: Session | null }
      error: null
    }>)

    const { result } = renderHook(() => useAuth())

    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBe(null)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should handle successful session', async () => {
    const mockUser = { id: '123', email: 'test@example.com', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: new Date().toISOString() }
    const mockSession: Session = { 
      user: mockUser,
      access_token: 'mock-token',
      refresh_token: 'mock-refresh',
      expires_in: 3600,
      token_type: 'bearer',
      expires_at: Date.now() + 3600000
    }
    
    const deferred = createDeferred<{ data: { session: Session | null }; error: null }>()
    vi.mocked(supabase.auth.getSession).mockReturnValueOnce(deferred.promise)

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      deferred.resolve({ data: { session: mockSession }, error: null })
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('should handle signOut', async () => {
    const deferred = createDeferred<{ data: { session: Session | null }; error: null }>()
    vi.mocked(supabase.auth.getSession).mockReturnValueOnce(deferred.promise)
    vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: null })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      deferred.resolve({ data: { session: null }, error: null })
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.signOut()
    })

    expect(supabase.auth.signOut).toHaveBeenCalled()
  })
})
