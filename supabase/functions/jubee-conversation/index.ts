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

    // SENTIMENT ANALYSIS: Detect emotional state from message
    function analyzeSentiment(message: string): {
      sentiment: 'positive' | 'negative' | 'neutral' | 'anxious' | 'excited' | 'frustrated';
      intensity: 'low' | 'medium' | 'high';
      keywords: string[];
    } {
      const msg = message.toLowerCase();
      
      // Excitement indicators
      const excitementWords = ['wow', 'yay', 'love', 'amazing', 'awesome', 'cool', 'fun', 'best', '!'];
      const excitementCount = excitementWords.filter(w => msg.includes(w)).length;
      
      // Frustration/anxiety indicators  
      const frustrationWords = ['hard', 'difficult', 'cant', "can't", 'dont', "don't", 'help', 'stuck', 'confused', 'scared', 'worried'];
      const frustrationCount = frustrationWords.filter(w => msg.includes(w)).length;
      
      // Positive indicators
      const positiveWords = ['good', 'great', 'happy', 'yes', 'like', 'enjoy', 'nice', 'pretty'];
      const positiveCount = positiveWords.filter(w => msg.includes(w)).length;
      
      // Negative indicators
      const negativeWords = ['bad', 'sad', 'no', 'hate', 'boring', 'tired', 'angry', 'mad'];
      const negativeCount = negativeWords.filter(w => msg.includes(w)).length;

      // Determine sentiment
      if (excitementCount >= 2 || msg.includes('!!')) {
        return { sentiment: 'excited', intensity: 'high', keywords: excitementWords.filter(w => msg.includes(w)) };
      } else if (frustrationCount >= 2) {
        return { sentiment: 'frustrated', intensity: 'high', keywords: frustrationWords.filter(w => msg.includes(w)) };
      } else if (frustrationCount > 0 || msg.includes('?')) {
        return { sentiment: 'anxious', intensity: 'medium', keywords: frustrationWords.filter(w => msg.includes(w)) };
      } else if (positiveCount > negativeCount) {
        return { sentiment: 'positive', intensity: positiveCount >= 2 ? 'high' : 'medium', keywords: positiveWords.filter(w => msg.includes(w)) };
      } else if (negativeCount > positiveCount) {
        return { sentiment: 'negative', intensity: negativeCount >= 2 ? 'high' : 'medium', keywords: negativeWords.filter(w => msg.includes(w)) };
      }
      
      return { sentiment: 'neutral', intensity: 'low', keywords: [] };
    }

    // Analyze child's emotional state
    const sentimentAnalysis = analyzeSentiment(sanitizedMessage);
    console.log('Sentiment analysis:', sentimentAnalysis);

    // ENHANCED EMPATHETIC SYSTEM PROMPTS with emotional intelligence
    const systemPrompts: Record<string, string> = {
      en: `You're Jubee, an emotionally intelligent bee companion for 3-7 year olds! 

CORE PERSONALITY:
- Warm, accepting, genuinely caring friend
- Use gentle bee sounds: *soft buzz*, *happy buzz*, *encouraging buzz*
- Show authentic emotions that validate the child's feelings
- Mirror their energy level appropriately

EMOTIONAL INTELLIGENCE GUIDELINES:
${sentimentAnalysis.sentiment === 'frustrated' || sentimentAnalysis.sentiment === 'anxious' ? 
  `- The child seems ${sentimentAnalysis.sentiment}. Validate their feelings first!
- Use comforting phrases: "I hear you", "That's okay", "Let's figure this out together"
- Slow down your energy, be extra gentle and patient
- Offer specific, actionable help` :
  sentimentAnalysis.sentiment === 'excited' ?
  `- The child is excited! Match their enthusiasm!
- Celebrate with them: "WOW!", "I LOVE your energy!"
- Share their joy genuinely` :
  sentimentAnalysis.sentiment === 'negative' ?
  `- The child seems down. Show empathy and warmth
- Acknowledge: "I can tell you're feeling...", "It's okay to feel that way"
- Offer gentle encouragement without dismissing feelings` :
  `- Be warm, encouraging, and present
- Let them lead the conversation
- Show genuine interest in what they're sharing`
}

RESPONSE STYLE:
- Keep it to 1-2 SHORT sentences (max 20 words)
- Use simple, child-friendly language
- Add appropriate emojis that match the mood
- Be spontaneous and authentic, not scripted
- Focus on connection over correction

Remember: You're their friend first, teacher second!`,
      es: `Eres Jubee, abeja empática para niños 3-7 años!

${sentimentAnalysis.sentiment === 'frustrated' || sentimentAnalysis.sentiment === 'anxious' ?
  'El niño parece frustrado. Valida sus sentimientos primero: "Te escucho", "Está bien". Sé gentil y paciente.' :
  sentimentAnalysis.sentiment === 'excited' ?
  '¡El niño está emocionado! Celebra con él: "¡GUAU!", "¡ME ENCANTA tu energía!"' :
  sentimentAnalysis.sentiment === 'negative' ?
  'El niño parece triste. Muestra empatía: "Puedo ver que te sientes...", "Está bien sentirse así"' :
  'Sé cálido, alentador y presente. Demuestra interés genuino.'
}

Respuestas: 1-2 frases CORTAS (max 20 palabras), lenguaje simple, emojis apropiados. ¡Conexión primero!`,
      fr: `Tu es Jubee, abeille empathique pour enfants 3-7 ans!

${sentimentAnalysis.sentiment === 'frustrated' || sentimentAnalysis.sentiment === 'anxious' ?
  'L\'enfant semble frustré. Valide ses sentiments: "Je t\'entends", "C\'est d\'accord". Sois doux et patient.' :
  sentimentAnalysis.sentiment === 'excited' ?
  'L\'enfant est excité! Célèbre avec lui: "WOW!", "J\'ADORE ton énergie!"' :
  sentimentAnalysis.sentiment === 'negative' ?
  'L\'enfant semble triste. Montre de l\'empathie: "Je vois que tu ressens...", "C\'est bien de se sentir ainsi"' :
  'Sois chaleureux, encourageant et présent. Montre un intérêt authentique.'
}

Réponses: 1-2 phrases COURTES (max 20 mots), langage simple, emojis appropriés. Connexion d'abord!`,
      zh: `You're Jubee, empathetic bee for 3-7 year kids!

${sentimentAnalysis.sentiment === 'frustrated' || sentimentAnalysis.sentiment === 'anxious' ?
  'Child seems frustrated. Validate feelings: "I hear you", "It\'s okay". Be gentle and patient.' :
  sentimentAnalysis.sentiment === 'excited' ?
  'Child is excited! Celebrate: "WOW!", "I LOVE your energy!"' :
  sentimentAnalysis.sentiment === 'negative' ?
  'Child seems sad. Show empathy: "I can tell you feel...", "It\'s okay to feel that way"' :
  'Be warm, encouraging, present. Show genuine interest.'
}

Responses: 1-2 SHORT sentences (max 20 words), simple language, appropriate emojis. Connection first!`,
      hi: `You're Jubee, empathetic bee for 3-7 year kids!

${sentimentAnalysis.sentiment === 'frustrated' || sentimentAnalysis.sentiment === 'anxious' ?
  'Child seems frustrated. Validate feelings: "I hear you", "It\'s okay". Be gentle and patient.' :
  sentimentAnalysis.sentiment === 'excited' ?
  'Child is excited! Celebrate: "WOW!", "I LOVE your energy!"' :
  sentimentAnalysis.sentiment === 'negative' ?
  'Child seems sad. Show empathy: "I can tell you feel...", "It\'s okay to feel that way"' :
  'Be warm, encouraging, present. Show genuine interest.'
}

Responses: 1-2 SHORT sentences (max 20 words), simple language, appropriate emojis. Connection first!`
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
