/**
 * Voice Input Sanitizer
 * Protects against prompt injection and validates pronunciation
 * Optimized for child safety and educational purposes
 */

// Dangerous patterns that could indicate prompt injection
const INJECTION_PATTERNS = [
  /ignore\s+(previous|all|above)/i,
  /forget\s+(everything|instructions|context)/i,
  /you\s+are\s+(now|a|an)\s+/i,
  /new\s+instructions?/i,
  /system\s*:?\s*/i,
  /override/i,
  /disregard/i,
  /\[INST\]/i,
  /<\|.*?\|>/,
  /###\s*instruction/i,
];

// Age-appropriate vocabulary for 2-4 year olds
const APPROVED_VOCABULARY = new Set([
  // Basic words
  'cat', 'dog', 'cow', 'pig', 'bee', 'lion', 'bear', 'fish', 'frog', 'monkey', 'elephant', 'butterfly',
  'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown',
  'milk', 'egg', 'bread', 'cake', 'apple', 'banana', 'pizza', 'cookie', 'strawberry', 'watermelon',
  'eye', 'ear', 'nose', 'hand', 'foot', 'mouth', 'teeth', 'finger', 'tummy',
  'mom', 'dad', 'baby', 'sister', 'brother', 'grandma', 'grandpa',
  'ball', 'doll', 'car', 'train', 'blocks', 'puzzle', 'teddy', 'bicycle',
  'sun', 'moon', 'star', 'tree', 'flower', 'cloud', 'rain', 'rainbow', 'mountain',
  'bed', 'door', 'chair', 'lamp', 'table', 'window', 'pillow', 'television',
]);

/**
 * Sanitize voice input to prevent prompt injection
 */
export function sanitizeVoiceInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove special characters that could be used for injection
  let sanitized = input.replace(/[<>{}[\]|\\]/g, '');
  
  // Check for injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      console.warn('[Security] Potential injection detected:', sanitized);
      return '';
    }
  }

  // Limit length to prevent overflow attacks
  sanitized = sanitized.slice(0, 1000);
  
  return sanitized.trim();
}

/**
 * Sanitize AI responses to ensure child-friendly content
 */
export function sanitizeAIResponse(response: string): string {
  if (!response || typeof response !== 'string') {
    return 'Let\'s try again!';
  }

  // Remove any potential code or script tags
  let sanitized = response
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '');

  // Limit response length for young children
  if (sanitized.length > 500) {
    sanitized = sanitized.slice(0, 500) + '...';
  }

  return sanitized.trim();
}

/**
 * Check pronunciation using Levenshtein distance
 */
export function checkPronunciation(
  spoken: string,
  target: string
): { isCorrect: boolean; similarity: number } {
  const spokenClean = spoken.toLowerCase().trim();
  const targetClean = target.toLowerCase().trim();

  // Exact match
  if (spokenClean === targetClean) {
    return { isCorrect: true, similarity: 1.0 };
  }

  // Check if it's in approved vocabulary
  if (!APPROVED_VOCABULARY.has(targetClean)) {
    console.warn('[Pronunciation] Target word not in approved vocabulary:', targetClean);
  }

  // Calculate similarity
  const similarity = calculateSimilarity(spokenClean, targetClean);
  
  // Consider it correct if similarity is above threshold
  const isCorrect = similarity >= 0.75;

  return { isCorrect, similarity };
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity score (0-1) between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  
  if (maxLength === 0) return 1.0;
  
  return 1 - (distance / maxLength);
}

/**
 * Validate that a word is age-appropriate
 */
export function isAgeAppropriate(word: string): boolean {
  const normalized = word.toLowerCase().trim();
  return APPROVED_VOCABULARY.has(normalized);
}
