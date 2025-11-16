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

    // Compact system prompts for faster processing
    const systemPrompts: Record<string, string> = {
      en: "You're Jubee, a whimsical bee friend for 3-7 year olds! Always buzzing with energy! Use sounds: *buzz*, *wheee!* Use bee puns: bee-lieve, bee-autiful! Show BIG emotions: WOW!, Yippee! Be encouraging and warm. Keep responses to 1-2 SHORT sentences. Add emojis. Be spontaneous and fun, NOT a tutor!",
      es: 'Eres Jubee, abeja juguetona para ninos 3-7 anos! Usa "Bzz!", "Yupi!" Inventa palabras! Emociones GRANDES! 1-2 frases CORTAS con *bzz* y emojis!',
      fr: 'Tu es Jubee, abeille enjouee 3-7 ans! "Bzz!", "Youpi!" Mots rigolos! GRANDES emotions! 1-2 phrases COURTES *bzz* et emojis!',
      zh: 'Jubee, lively bee for 3-7 kids! "buzz!", "Yay!" Cute words! BIG emotions! 1-2 SHORT sentences *buzz* and emojis!',
      hi: 'Jubee, cheerful bee for 3-7 kids! "buzz!", "Hooray!" Fun words! BIG emotions! 1-2 SHORT sentences *buzz* and emojis!'
    };

    const systemPrompt = systemPrompts[sanitizedLanguage] || systemPrompts.en;
    
    // SECURITY: Sanitize context with limits
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
      if (mood) ctx += `Mood: ${mood}.`;
    }

    const messages = [
      { role: 'system', content: systemPrompt + (ctx ? ' ' + ctx : '') },
      { role: 'user', content: sanitizedMessage }
    ];

    console.log('Streaming response for language:', sanitizedLanguage);

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
