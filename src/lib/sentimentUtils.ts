/**
 * Sentiment Analysis Utilities
 * SECURITY: Safe client-side sentiment detection with guardrails
 */

export type Sentiment = 'positive' | 'negative' | 'neutral' | 'anxious' | 'excited' | 'frustrated'
export type Mood = 'happy' | 'excited' | 'frustrated' | 'curious' | 'tired'
export type Intensity = 'low' | 'medium' | 'high'

export interface SentimentAnalysis {
  sentiment: Sentiment
  mood: Mood
  intensity: Intensity
  confidence: number
  keywords: string[]
}

// SECURITY: Safe constants
const MAX_TEXT_LENGTH = 500
const MAX_KEYWORDS = 5
const ALLOWED_SENTIMENTS: Sentiment[] = ['positive', 'negative', 'neutral', 'anxious', 'excited', 'frustrated']
const ALLOWED_MOODS: Mood[] = ['happy', 'excited', 'frustrated', 'curious', 'tired']

// ⚡ Bolt Optimization: Use Sets for O(1) lookup to improve performance
const PATTERNS_SET = {
  excitement: new Set(['wow', 'yay', 'love', 'amazing', 'awesome', 'cool', 'fun', 'best', 'yippee', 'hooray']),
  frustration: new Set(['hard', 'difficult', 'cant', 'help', 'stuck', 'confused', 'scared', 'worried']),
  curiosity: new Set(['what', 'why', 'how', 'when', 'where', 'who', 'which']),
  positive: new Set(['good', 'great', 'happy', 'yes', 'like', 'enjoy', 'nice', 'pretty', 'beautiful']),
  negative: new Set(['bad', 'sad', 'no', 'hate', 'boring', 'tired', 'angry', 'mad', 'mean'])
}

/**
 * SECURE sentiment analysis with input validation
 */
export function analyzeSentiment(text: string): SentimentAnalysis {
  // SECURITY: Validate input
  if (!text || typeof text !== 'string') {
    return {
      sentiment: 'neutral',
      mood: 'happy',
      intensity: 'low',
      confidence: 0.5,
      keywords: []
    }
  }

  // SECURITY: Limit text length
  const sanitized = text.slice(0, MAX_TEXT_LENGTH).toLowerCase()
  
  try {
    // SAFE: Use simple word splitting instead of regex
    const words = sanitized.split(/\s+/)
    
    // ⚡ Bolt Optimization: Calculate scores and matches in a single O(N) pass
    const scores = { excitement: 0, frustration: 0, curiosity: 0, positive: 0, negative: 0 }
    const matches = { excitement: [] as string[], frustration: [] as string[], curiosity: [] as string[], positive: [] as string[], negative: [] as string[] }

    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (PATTERNS_SET.excitement.has(w)) { scores.excitement++; matches.excitement.push(w); }
      if (PATTERNS_SET.frustration.has(w)) { scores.frustration++; matches.frustration.push(w); }
      if (PATTERNS_SET.curiosity.has(w)) { scores.curiosity++; matches.curiosity.push(w); }
      if (PATTERNS_SET.positive.has(w)) { scores.positive++; matches.positive.push(w); }
      if (PATTERNS_SET.negative.has(w)) { scores.negative++; matches.negative.push(w); }
    }

    // SAFE: Check for punctuation safely
    const exclamationCount = (sanitized.match(/!/g) || []).length
    const hasMultipleExclamation = exclamationCount >= 2
    const hasQuestions = sanitized.includes('?')

    // Determine dominant sentiment
    let sentiment: Sentiment = 'neutral'
    let mood: Mood = 'happy'
    let intensity: Intensity = 'low'
    let confidence = 0.5
    const keywords: string[] = []

    if (scores.excitement >= 2 || hasMultipleExclamation) {
      sentiment = 'excited'
      mood = 'excited'
      intensity = 'high'
      confidence = 0.85
      keywords.push(...matches.excitement.slice(0, MAX_KEYWORDS))
    } else if (scores.frustration >= 2) {
      sentiment = 'frustrated'
      mood = 'frustrated'
      intensity = 'high'
      confidence = 0.8
      keywords.push(...matches.frustration.slice(0, MAX_KEYWORDS))
    } else if (scores.frustration > 0 || hasQuestions) {
      sentiment = 'anxious'
      mood = 'curious'
      intensity = 'medium'
      confidence = 0.7
      keywords.push(...matches.frustration.slice(0, MAX_KEYWORDS))
    } else if (scores.positive > scores.negative) {
      sentiment = 'positive'
      mood = 'happy'
      intensity = scores.positive >= 2 ? 'medium' : 'low'
      confidence = 0.65
      keywords.push(...matches.positive.slice(0, MAX_KEYWORDS))
    } else if (scores.negative > scores.positive) {
      sentiment = 'negative'
      mood = 'tired'
      intensity = scores.negative >= 2 ? 'medium' : 'low'
      confidence = 0.65
      keywords.push(...matches.negative.slice(0, MAX_KEYWORDS))
    }

    // SECURITY: Validate results
    if (!ALLOWED_SENTIMENTS.includes(sentiment)) sentiment = 'neutral'
    if (!ALLOWED_MOODS.includes(mood)) mood = 'happy'

    return {
      sentiment,
      mood,
      intensity,
      confidence: Math.min(1, Math.max(0, confidence)),
      keywords: keywords.slice(0, MAX_KEYWORDS)
    }
  } catch (error) {
    // FALLBACK: Safe default
    console.error('Sentiment analysis error:', error)
    return {
      sentiment: 'neutral',
      mood: 'happy',
      intensity: 'low',
      confidence: 0.5,
      keywords: []
    }
  }
}

/**
 * SAFE empathetic prefix generation
 */
export function getEmpatheticPrefix(sentiment: SentimentAnalysis): string {
  const prefixes: Record<Sentiment, string[]> = {
    excited: ['*buzz buzz!* WOW!', '*happy buzz!*', 'Yippee!'],
    frustrated: ['*gentle buzz*', '*soft buzz*', 'Let me help...'],
    anxious: ['*curious buzz*', "Great question!", 'Hmm...'],
    positive: ['*cheerful buzz*', '*happy buzz*', 'Yay!'],
    negative: ['*comforting buzz*', '*gentle buzz*', 'I see...'],
    neutral: ['*buzz*', '*friendly buzz*', 'Hi!']
  }

  try {
    const options = prefixes[sentiment.sentiment] || prefixes.neutral
    return options[Math.floor(Math.random() * options.length)]
  } catch {
    return '*buzz*'
  }
}

/**
 * SAFE voice parameter calculation
 */
export function getVoiceParameters(sentiment: SentimentAnalysis): {
  speed: number
  mood: Mood
} {
  let speed = 1.15

  try {
    switch (sentiment.sentiment) {
      case 'excited':
        speed = sentiment.intensity === 'high' ? 1.35 : 1.25
        break
      case 'frustrated':
        speed = 0.9
        break
      case 'anxious':
        speed = 1.05
        break
      case 'negative':
        speed = 0.95
        break
      case 'positive':
        speed = 1.2
        break
    }

    // SECURITY: Clamp speed to safe range
    return {
      speed: Math.max(0.8, Math.min(1.5, speed)),
      mood: ALLOWED_MOODS.includes(sentiment.mood) ? sentiment.mood : 'happy'
    }
  } catch (error) {
    // FALLBACK: Safe defaults
    console.error('Voice parameter error:', error)
    return { speed: 1.15, mood: 'happy' }
  }
}
