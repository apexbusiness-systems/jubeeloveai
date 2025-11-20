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
    
    // SAFE: Define word lists (no regex injection)
    const patterns = {
      excitement: ['wow', 'yay', 'love', 'amazing', 'awesome', 'cool', 'fun', 'best', 'yippee', 'hooray'],
      frustration: ['hard', 'difficult', 'cant', 'help', 'stuck', 'confused', 'scared', 'worried'],
      curiosity: ['what', 'why', 'how', 'when', 'where', 'who', 'which'],
      positive: ['good', 'great', 'happy', 'yes', 'like', 'enjoy', 'nice', 'pretty', 'beautiful'],
      negative: ['bad', 'sad', 'no', 'hate', 'boring', 'tired', 'angry', 'mad', 'mean']
    }

    // SAFE: Count matches safely
    const scores = {
      excitement: words.filter(w => patterns.excitement.includes(w)).length,
      frustration: words.filter(w => patterns.frustration.includes(w)).length,
      curiosity: words.filter(w => patterns.curiosity.includes(w)).length,
      positive: words.filter(w => patterns.positive.includes(w)).length,
      negative: words.filter(w => patterns.negative.includes(w)).length
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
      keywords.push(...patterns.excitement.filter(w => sanitized.includes(w)).slice(0, MAX_KEYWORDS))
    } else if (scores.frustration >= 2) {
      sentiment = 'frustrated'
      mood = 'frustrated'
      intensity = 'high'
      confidence = 0.8
      keywords.push(...patterns.frustration.filter(w => sanitized.includes(w)).slice(0, MAX_KEYWORDS))
    } else if (scores.frustration > 0 || hasQuestions) {
      sentiment = 'anxious'
      mood = 'curious'
      intensity = 'medium'
      confidence = 0.7
      keywords.push(...patterns.frustration.filter(w => sanitized.includes(w)).slice(0, MAX_KEYWORDS))
    } else if (scores.positive > scores.negative) {
      sentiment = 'positive'
      mood = 'happy'
      intensity = scores.positive >= 2 ? 'medium' : 'low'
      confidence = 0.65
      keywords.push(...patterns.positive.filter(w => sanitized.includes(w)).slice(0, MAX_KEYWORDS))
    } else if (scores.negative > scores.positive) {
      sentiment = 'negative'
      mood = 'tired'
      intensity = scores.negative >= 2 ? 'medium' : 'low'
      confidence = 0.65
      keywords.push(...patterns.negative.filter(w => sanitized.includes(w)).slice(0, MAX_KEYWORDS))
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
