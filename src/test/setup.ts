import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}))

// Mock IndexedDB Service
vi.mock('@/lib/indexedDB', () => ({
  jubeeDB: {
    init: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    getAll: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
    getUnsynced: vi.fn().mockResolvedValue([]),
    clear: vi.fn().mockResolvedValue(undefined),
    putBulk: vi.fn().mockResolvedValue(undefined),
  },
}))

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root: Element | Document | null = null
  rootMargin = ''
  thresholds: ReadonlyArray<number> = []
  
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
  unobserve() {}
} as unknown as typeof globalThis.IntersectionObserver

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock Web Speech API
class MockSpeechRecognition {
  start = vi.fn()
  stop = vi.fn()
  abort = vi.fn()
  onresult: ((event: unknown) => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  onend: (() => void) | null = null
}

Object.defineProperty(global, 'SpeechRecognition', {
  writable: true,
  value: MockSpeechRecognition
})

Object.defineProperty(global, 'webkitSpeechRecognition', {
  writable: true,
  value: MockSpeechRecognition
})

// Mock AudioContext
global.AudioContext = class AudioContext {
  baseLatency = 0
  outputLatency = 0
  sampleRate = 48000
  currentTime = 0
  state = 'running' as AudioContextState
  destination = {} as unknown as AudioDestinationNode
  
  createGain = vi.fn(() => ({
    connect: vi.fn(),
    gain: { value: 1 },
  }))
  createOscillator = vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { value: 440 },
  }))
  close = vi.fn()
  resume = vi.fn()
  suspend = vi.fn()
  createBufferSource = vi.fn()
  createMediaElementSource = vi.fn()
  createMediaStreamDestination = vi.fn()
  createMediaStreamSource = vi.fn()
} as unknown as typeof globalThis.AudioContext
