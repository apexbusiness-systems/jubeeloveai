/**
 * Sentiment Analysis Utilities
 * Provides client-side sentiment detection for enhanced empathy
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

/**
 * Analyze text sentiment with detailed breakdown
 */
export function analyzeSentiment(text: string): SentimentAnalysis {
  const msg = text.toLowerCase()
  
  // Pattern matching with weights
  const patterns = {
    excitement: {
      words: ['wow', 'yay', 'love', 'amazing', 'awesome', 'cool', 'fun', 'best', 'yippee', 'hooray'],
      weight: 2,
      mood: 'excited' as Mood
    },
    frustration: {
      words: ['hard', 'difficult', "can't", "cant", "don't", "dont", 'help', 'stuck', 'confused', 'scared', 'worried'],
      weight: 2,
      mood: 'frustrated' as Mood
    },
    curiosity: {
      words: ['what', 'why', 'how', 'when', 'where', 'who', 'which', '?'],
      weight: 1.5,
      mood: 'curious' as Mood
    },
    positive: {
      words: ['good', 'great', 'happy', 'yes', 'like', 'enjoy', 'nice', 'pretty', 'beautiful'],
      weight: 1,
      mood: 'happy' as Mood
    },
    negative: {
      words: ['bad', 'sad', 'no', 'hate', 'boring', 'tired', 'angry', 'mad', 'mean'],
      weight: 1.5,
      mood: 'tired' as Mood
    }
  }

  // Calculate scores
  const scores: Record<string, { score: number; keywords: string[]; mood: Mood }> = {}
  
  for (const [key, pattern] of Object.entries(patterns)) {
    const keywords = pattern.words.filter(word => msg.includes(word))
    scores[key] = {
      score: keywords.length * pattern.weight,
      keywords,
      mood: pattern.mood
    }
  }

  // Intensity modifiers
  const hasExclamation = (text.match(/!/g) || []).length
  const hasMultipleExclamation = hasExclamation >= 2
  const hasQuestions = (text.match(/\?/g) || []).length
  const isAllCaps = text === text.toUpperCase() && text.length > 3

  // Determine dominant sentiment
  const sortedScores = Object.entries(scores).sort((a, b) => b[1].score - a[1].score)
  const topScore = sortedScores[0]

  let sentiment: Sentiment = 'neutral'
  let mood: Mood = 'happy'
  let intensity: Intensity = 'low'
  let confidence = 0.5
  let keywords: string[] = []

  if (topScore && topScore[1].score > 0) {
    const category = topScore[0]
    keywords = topScore[1].keywords
    mood = topScore[1].mood
    confidence = Math.min(0.95, 0.5 + (topScore[1].score * 0.1))

    // Map to sentiment
    if (category === 'excitement') {
      sentiment = 'excited'
      intensity = hasMultipleExclamation || isAllCaps ? 'high' : 'medium'
    } else if (category === 'frustration') {
      sentiment = 'frustrated'
      intensity = topScore[1].score >= 3 ? 'high' : 'medium'
    } else if (category === 'curiosity') {
      sentiment = 'anxious'
      intensity = hasQuestions >= 2 ? 'high' : 'medium'
    } else if (category === 'positive') {
      sentiment = 'positive'
      intensity = hasExclamation > 0 ? 'medium' : 'low'
    } else if (category === 'negative') {
      sentiment = 'negative'
      intensity = topScore[1].score >= 2 ? 'high' : 'medium'
    }
  } else {
    // Neutral fallback
    sentiment = 'neutral'
    mood = 'happy'
    intensity = 'low'
  }

  return {
    sentiment,
    mood,
    intensity,
    confidence,
    keywords
  }
}

/**
 * Get empathetic response prefix based on sentiment
 */
export function getEmpatheticPrefix(sentiment: SentimentAnalysis): string {
  const prefixes: Record<Sentiment, string[]> = {
    excited: ['*buzz buzz!* WOW!', '*happy buzz!* Oh my!', 'Yippee!'],
    frustrated: ['*gentle buzz* I hear you...', '*soft buzz* I understand...', 'Let me help...'],
    anxious: ['*curious buzz* Hmm...', "That's a great question!", 'Let me think...'],
    positive: ['*cheerful buzz*', '*happy buzz*', 'Yay!'],
    negative: ['*comforting buzz*', '*gentle buzz*', 'I see...'],
    neutral: ['*buzz*', '*friendly buzz*', 'Hi there!']
  }

  const options = prefixes[sentiment.sentiment] || prefixes.neutral
  return options[Math.floor(Math.random() * options.length)]
}

/**
 * Adjust voice parameters based on sentiment
 */
export function getVoiceParameters(sentiment: SentimentAnalysis): {
  speed: number
  mood: Mood
} {
  let speed = 1.15 // Default

  switch (sentiment.sentiment) {
    case 'excited':
      speed = sentiment.intensity === 'high' ? 1.4 : 1.3
      break
    case 'frustrated':
      speed = 0.9 // Slower, more patient
      break
    case 'anxious':
      speed = 1.05 // Measured, thoughtful
      break
    case 'negative':
      speed = 0.95 // Gentle, calm
      break
    case 'positive':
      speed = 1.25 // Upbeat
      break
  }

  return {
    speed: Math.max(0.8, Math.min(1.5, speed)),
    mood: sentiment.mood
  }
}
