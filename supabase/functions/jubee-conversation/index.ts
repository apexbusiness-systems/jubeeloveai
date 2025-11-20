import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// RATE LIMITING: IP-based protection against abuse
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20; // 20 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function getRateLimitKey(req: Request): string {
  // Extract IP from various possible headers
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnecting = req.headers.get('cf-connecting-ip');
  
  return forwarded?.split(',')[0].trim() || 
         realIp || 
         cfConnecting || 
         'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // Clean up expired entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetAt < now) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (!record || record.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count++;
  return { allowed: true };
}

// SECURITY: Input validation and sanitization
const MAX_MESSAGE_LENGTH = 500;
const MAX_CHILD_NAME_LENGTH = 50;
const MAX_CONTEXT_LENGTH = 200;
const ALLOWED_LANGUAGES = ['en', 'es', 'fr', 'zh', 'hi'];
const ALLOWED_MOODS = ['happy', 'excited', 'frustrated', 'curious', 'tired'];
const ALLOWED_SENTIMENTS = ['positive', 'negative', 'neutral', 'anxious', 'excited', 'frustrated'];

function sanitizeInput(input: string, maxLength: number): string {
  if (typeof input !== 'string') return '';
  return input
    .slice(0, maxLength)
    .replace(/[<>{}]/g, '')
    .trim();
}

function validateLanguage(lang: string): string {
  return ALLOWED_LANGUAGES.includes(lang) ? lang : 'en';
}

function validateMood(mood: string): string | undefined {
  return ALLOWED_MOODS.includes(mood) ? mood : undefined;
}

// SENTIMENT ANALYSIS with robust guardrails and security
function analyzeSentiment(message: string): {
  sentiment: string;
  intensity: string;
  keywords: string[];
} {
  // SECURITY: Validate input
  if (!message || typeof message !== 'string') {
    return { sentiment: 'neutral', intensity: 'low', keywords: [] };
  }
  
  // SECURITY: Limit length to prevent ReDoS attacks
  const sanitized = message.slice(0, MAX_MESSAGE_LENGTH).toLowerCase();
  
  try {
    // Simple word counting instead of complex regex for security
    const words = sanitized.split(/\s+/);
    
    // Define safe word lists (no regex injection possible)
    const excitementWords = ['wow', 'yay', 'love', 'amazing', 'awesome', 'cool', 'fun', 'best'];
    const frustrationWords = ['hard', 'difficult', 'cant', 'help', 'stuck', 'confused', 'scared', 'worried'];
    const positiveWords = ['good', 'great', 'happy', 'yes', 'like', 'enjoy', 'nice', 'pretty'];
    const negativeWords = ['bad', 'sad', 'no', 'hate', 'boring', 'tired', 'angry', 'mad'];
    
    // Count matches safely
    const excitementCount = words.filter(w => excitementWords.includes(w)).length;
    const frustrationCount = words.filter(w => frustrationWords.includes(w)).length;
    const positiveCount = words.filter(w => positiveWords.includes(w)).length;
    const negativeCount = words.filter(w => negativeWords.includes(w)).length;
    
    // Check for punctuation safely
    const hasMultipleExclamation = (sanitized.match(/!/g) || []).length >= 2;
    const hasQuestion = sanitized.includes('?');
    
    // Determine sentiment with safe logic
    let sentiment = 'neutral';
    let intensity = 'low';
    const keywords: string[] = [];
    
    if (excitementCount >= 2 || hasMultipleExclamation) {
      sentiment = 'excited';
      intensity = 'high';
      keywords.push(...excitementWords.filter(w => sanitized.includes(w)).slice(0, 3));
    } else if (frustrationCount >= 2) {
      sentiment = 'frustrated';
      intensity = 'high';
      keywords.push(...frustrationWords.filter(w => sanitized.includes(w)).slice(0, 3));
    } else if (frustrationCount > 0 || hasQuestion) {
      sentiment = 'anxious';
      intensity = 'medium';
      keywords.push(...frustrationWords.filter(w => sanitized.includes(w)).slice(0, 3));
    } else if (positiveCount > negativeCount) {
      sentiment = 'positive';
      intensity = positiveCount >= 2 ? 'medium' : 'low';
      keywords.push(...positiveWords.filter(w => sanitized.includes(w)).slice(0, 3));
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      intensity = negativeCount >= 2 ? 'medium' : 'low';
      keywords.push(...negativeWords.filter(w => sanitized.includes(w)).slice(0, 3));
    }
    
    // SECURITY: Validate sentiment result
    if (!ALLOWED_SENTIMENTS.includes(sentiment)) {
      sentiment = 'neutral';
    }
    
    return { sentiment, intensity, keywords };
  } catch (error) {
    // FALLBACK: Safe default if analysis fails
    console.error('Sentiment analysis error:', error);
    return { sentiment: 'neutral', intensity: 'low', keywords: [] };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // RATE LIMITING: Check before processing
  const clientIp = getRateLimitKey(req);
  const rateLimit = checkRateLimit(clientIp);
  
  if (!rateLimit.allowed) {
    console.warn(`Rate limit exceeded for IP: ${clientIp}`);
    return new Response(
      JSON.stringify({ 
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retryAfter: rateLimit.retryAfter 
      }),
      {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': rateLimit.retryAfter?.toString() || '60'
        },
      }
    );
  }

  try {
    // SECURITY: Parse with error handling
    let body;
    try {
      body = await req.json();
    } catch {
      throw new Error('Invalid JSON payload');
    }

    const { message, language = 'en', childName, context = {} } = body;
    
    // SECURITY: Validate and sanitize all inputs
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new Error('Valid message is required');
    }
    
    if (message.length > MAX_MESSAGE_LENGTH) {
      throw new Error(`Message too long (max ${MAX_MESSAGE_LENGTH} characters)`);
    }

    const sanitizedMessage = sanitizeInput(message, MAX_MESSAGE_LENGTH);
    const sanitizedLanguage = validateLanguage(language);
    const sanitizedChildName = childName ? sanitizeInput(childName, MAX_CHILD_NAME_LENGTH) : undefined;
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      throw new Error('AI service unavailable');
    }

    // SAFE SENTIMENT ANALYSIS: Use module-level function
    const sentimentAnalysis = analyzeSentiment(sanitizedMessage);
    console.log('Sentiment:', sentimentAnalysis.sentiment, 'Intensity:', sentimentAnalysis.intensity);

    // OPTIMIZED EMPATHETIC PROMPTS - Shorter for faster processing
    const emotionalContext = sentimentAnalysis.sentiment === 'frustrated' || sentimentAnalysis.sentiment === 'anxious' ?
      'Child needs comfort. Be gentle, patient, validating.' :
      sentimentAnalysis.sentiment === 'excited' ?
      'Child is excited! Match their energy and celebrate!' :
      sentimentAnalysis.sentiment === 'negative' ?
      'Child seems down. Show warmth and empathy.' :
      'Be warm and encouraging.';

    const systemPrompts: Record<string, string> = {
      en: `You're Jubee, emotionally intelligent bee friend for 3-7 year olds! ${emotionalContext} Use *buzz* sounds, be spontaneous, 1-2 SHORT sentences (max 20 words). Add emojis. Connect first, teach second!`,
      es: `Eres Jubee, abeja empática 3-7 años! ${emotionalContext} Usa *bzz*, 1-2 frases CORTAS (max 20 palabras), emojis!`,
      fr: `Tu es Jubee, abeille empathique 3-7 ans! ${emotionalContext} *bzz*, 1-2 phrases COURTES (max 20 mots), emojis!`,
      zh: `Jubee, empathetic bee 3-7 kids! ${emotionalContext} *buzz*, 1-2 SHORT sentences (max 20 words), emojis!`,
      hi: `Jubee, empathetic bee 3-7 kids! ${emotionalContext} *buzz*, 1-2 SHORT sentences (max 20 words), emojis!`
    };

    const systemPrompt = systemPrompts[sanitizedLanguage] || systemPrompts.en;
    
    // SECURITY: Sanitize context with limits + add sentiment context
    let ctx = '';
    if (sanitizedChildName) {
      ctx += `Child: ${sanitizedChildName}. `;
    }
    if (context.activity && typeof context.activity === 'string') {
      const activity = sanitizeInput(context.activity, MAX_CONTEXT_LENGTH);
      ctx += `Doing: ${activity}. `;
    }
    if (context.mood) {
      const mood = validateMood(context.mood);
      if (mood) ctx += `Mood: ${mood}. `;
    }
    
    // Add detected sentiment to context
    ctx += `Detected sentiment: ${sentimentAnalysis.sentiment} (${sentimentAnalysis.intensity}).`;

    const messages = [
      { role: 'system', content: systemPrompt + (ctx ? ' ' + ctx : '') },
      { role: 'user', content: sanitizedMessage }
    ];

    console.log('Streaming empathetic response for language:', sanitizedLanguage, 'sentiment:', sentimentAnalysis.sentiment);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + OPENAI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages,
        max_completion_tokens: 80,
        stream: true,
        service_tier: 'priority',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('RATE_LIMIT');
      } else if (response.status === 401) {
        throw new Error('AUTH_ERROR');
      }
      throw new Error('AI service temporarily unavailable');
    }

    // Stream the response back to client
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
    });
  } catch (error) {
    console.error('Error in jubee-conversation function:', error);
    
    const fallbackMessages: Record<string, string> = {
      en: "*Bzz-bzz!* Oopsie-daisy! My antennae got a bit tangled! But I'm still here with you, sweet flower!",
      es: "*Bzz-bzz!* Ay, caramba! Mis antenas se enredaron un poquito! Pero sigo aqui contigo, florecita!",
      fr: "*Bzz-bzz!* Oups-la! Mes antennes sont emmelees! Mais je suis la avec toi, petite fleur!",
      zh: "*Buzz!* Oh no! My antennae got tangled! But I'm still here with you, little flower!",
      hi: "*Buzz!* Oh my! My antennae got tangled! But I'm here with you, dear flower!"
    };

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    let fallback = fallbackMessages.en;
    
    try {
      const body = await new Response(req.body).json();
      fallback = fallbackMessages[body.language] || fallbackMessages.en;
    } catch {
      // Use default English fallback
    }

    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        response: fallback,
        success: false,
        fallback: true
      }),
      {
        status: errorMessage === 'RATE_LIMIT' ? 429 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
