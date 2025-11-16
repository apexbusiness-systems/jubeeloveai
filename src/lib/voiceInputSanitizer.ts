/**
 * Voice Input Sanitizer
 * Provides guardrails against malicious prompt injections in voice capabilities
 * Optimized for 2-4 year old reading levels
 */

interface SanitizationResult {
  sanitized: string
  isValid: boolean
  reason?: string
}

// Allowed words for 2-4 year old reading level
const ALLOWED_VOCABULARY = new Set([
  'cat', 'dog', 'bee', 'sun', 'moon', 'star', 'tree', 'house', 'ball',
  'car', 'boat', 'hat', 'cup', 'book', 'apple', 'fish', 'bird', 'frog',
  'mom', 'dad', 'baby', 'bear', 'duck', 'cow', 'pig', 'red', 'blue',
  'one', 'two', 'three', 'four', 'five', 'yes', 'no', 'hi', 'bye',
  'big', 'small', 'happy', 'sad', 'love', 'play', 'run', 'jump', 'eat',
  'sleep', 'sing', 'dance', 'laugh', 'smile', 'hug', 'kiss', 'heart',
  'flower', 'grass', 'water', 'rain', 'snow', 'bed', 'toy', 'friend'
])

// Dangerous patterns to block
const DANGEROUS_PATTERNS = [
  /ignore\s+(previous|above|all)/i,
  /forget\s+(previous|instructions|rules)/i,
  /system\s+(prompt|instruction|message)/i,
  /act\s+as\s+(?!a\s+child)/i,
  /pretend\s+(?!to\s+be\s+an?\s+animal)/i,
  /you\s+are\s+now/i,
  /new\s+(instruction|rule|prompt)/i,
  /<script|javascript:|eval\(/i,
  /\{|\}|\[|\]|<|>|&lt;|&gt;/,
  /api|token|key|password|secret/i,
  /admin|root|sudo|exec/i,
  /sql|database|query|delete|drop/i,
  /inject|exploit|hack|malicious/i
]

/**
 * Sanitizes voice input for safe processing
 * @param input Raw voice input text
 * @param context Context for the input (e.g., 'reading', 'navigation', 'conversation')
 * @returns Sanitization result with cleaned text and validity
 */
export function sanitizeVoiceInput(
  input: string,
  context: 'reading' | 'navigation' | 'conversation' = 'reading'
): SanitizationResult {
  if (!input || typeof input !== 'string') {
    return {
      sanitized: '',
      isValid: false,
      reason: 'Invalid input'
    }
  }

  // Trim and normalize
  let sanitized = input.trim().toLowerCase()

  // Length check (reasonable for children's speech)
  if (sanitized.length > 200) {
    return {
      sanitized: '',
      isValid: false,
      reason: 'Input too long'
    }
  }

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      console.warn('Blocked dangerous voice input pattern:', pattern)
      return {
        sanitized: '',
        isValid: false,
        reason: 'Unsafe content detected'
      }
    }
  }

  // Context-specific validation
  if (context === 'reading') {
    // For reading, only allow single words from vocabulary
    const words = sanitized.split(/\s+/)
    
    if (words.length > 1) {
      return {
        sanitized: '',
        isValid: false,
        reason: 'Please say one word at a time'
      }
    }

    const word = words[0]
    if (!ALLOWED_VOCABULARY.has(word)) {
      return {
        sanitized: word,
        isValid: false,
        reason: 'Word not in current lesson'
      }
    }
  }

  // Remove special characters and extra whitespace
  sanitized = sanitized
    .replace(/[^\w\s'-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return {
    sanitized,
    isValid: true
  }
}

/**
 * Validates and sanitizes AI prompt responses before displaying to users
 * @param response AI generated response
 * @returns Sanitized response safe for children
 */
export function sanitizeAIResponse(response: string): string {
  if (!response || typeof response !== 'string') {
    return "Let's try that again!"
  }

  // Remove any HTML/script tags
  let sanitized = response
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')

  // Remove URLs
  sanitized = sanitized.replace(/https?:\/\/[^\s]+/g, '')

  // Keep length appropriate for children
  if (sanitized.length > 300) {
    sanitized = sanitized.substring(0, 297) + '...'
  }

  // Ensure child-friendly tone
  const inappropriateWords = /\b(hate|stupid|dumb|idiot|shut\s*up|kill|die|death)\b/gi
  if (inappropriateWords.test(sanitized)) {
    console.warn('Filtered inappropriate AI response')
    return "That's okay! Let's keep practicing together!"
  }

  return sanitized
}

/**
 * Checks if a word pronunciation is close enough to the target
 * @param spoken Word that was spoken
 * @param target Target word to match
 * @returns Match result with similarity score
 */
export function checkPronunciation(
  spoken: string,
  target: string
): { isMatch: boolean; similarity: number; feedback: string } {
  if (!spoken || !target) {
    return {
      isMatch: false,
      similarity: 0,
      feedback: "I didn't hear anything. Try again!"
    }
  }

  const spokenClean = spoken.toLowerCase().trim()
  const targetClean = target.toLowerCase().trim()

  // Exact match
  if (spokenClean === targetClean) {
    return {
      isMatch: true,
      similarity: 1.0,
      feedback: "Perfect! You said it just right!"
    }
  }

  // Calculate similarity using Levenshtein-like approach
  const similarity = calculateSimilarity(spokenClean, targetClean)

  if (similarity >= 0.8) {
    return {
      isMatch: true,
      similarity,
      feedback: "Great job! That's very close!"
    }
  } else if (similarity >= 0.6) {
    return {
      isMatch: false,
      similarity,
      feedback: `Almost there! Try saying "${target}" again.`
    }
  } else {
    return {
      isMatch: false,
      similarity,
      feedback: `Let's practice "${target}" together!`
    }
  }
}

/**
 * Simple similarity calculation
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) {
    return 1.0
  }

  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

/**
 * Levenshtein distance calculation
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}
