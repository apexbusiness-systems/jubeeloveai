import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// RATE LIMITING: IP-based protection against abuse
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 15; // 15 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function getRateLimitKey(req: Request): string {
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

// SECURITY: Input validation constants
const MAX_TEXT_LENGTH = 4096; // OpenAI TTS limit
const MIN_TEXT_LENGTH = 1;
const ALLOWED_VOICES = ['shimmer', 'nova', 'alloy', 'echo', 'fable', 'onyx'];
const ALLOWED_MOODS = ['happy', 'excited', 'frustrated', 'curious', 'tired'];
const ALLOWED_LANGUAGES = ['en', 'es', 'fr', 'zh', 'hi'];

function sanitizeText(text: string): string {
  if (typeof text !== 'string') return '';
  return text
    .slice(0, MAX_TEXT_LENGTH)
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .trim();
}

function validateVoice(voice: string): string {
  return ALLOWED_VOICES.includes(voice) ? voice : 'shimmer';
}

function validateMood(mood: string): string {
  return ALLOWED_MOODS.includes(mood) ? mood : 'happy';
}

function validateLanguage(lang: string): string {
  return ALLOWED_LANGUAGES.includes(lang) ? lang : 'en';
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

    const { text, gender, language = 'en', mood = 'happy', voice: selectedVoice } = body;
    
    // SECURITY: Validate text input
    if (!text || typeof text !== 'string') {
      throw new Error('Valid text is required');
    }

    if (text.length > MAX_TEXT_LENGTH) {
      throw new Error(`Text too long (max ${MAX_TEXT_LENGTH} characters)`);
    }

    if (text.length < MIN_TEXT_LENGTH) {
      throw new Error('Text is too short');
    }

    const sanitizedText = sanitizeText(text);
    const sanitizedLanguage = validateLanguage(language);
    const sanitizedMood = validateMood(mood);
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      throw new Error('Speech synthesis service unavailable');
    }

    // WHIMSICAL VOICE MAPPING - More expressive and animated!
    // SECURITY: Validate voice selection
    let voice = selectedVoice ? validateVoice(selectedVoice) : 'shimmer';
    
    if (!selectedVoice) {
      // FEMALE VOICES - High energy, playful, expressive
      if (gender === 'female') {
        if (sanitizedMood === 'excited' || sanitizedMood === 'happy') {
          voice = 'shimmer';
        } else if (sanitizedMood === 'curious') {
          voice = 'nova';
        } else {
          voice = 'shimmer';
        }
      } 
      // MALE VOICES - Warm, friendly, animated
      else {
        if (sanitizedMood === 'excited' || sanitizedMood === 'happy') {
          voice = 'fable';
        } else if (sanitizedMood === 'curious') {
          voice = 'onyx';
        } else if (sanitizedMood === 'frustrated' || sanitizedMood === 'tired') {
          voice = 'echo';
        } else {
          voice = 'fable';
        }
      }
      
      // Language-specific optimization
      if (sanitizedLanguage === 'zh' || sanitizedLanguage === 'hi') {
        voice = 'shimmer';
      } else if (sanitizedLanguage === 'es') {
        voice = gender === 'female' ? 'shimmer' : 'fable';
      } else if (sanitizedLanguage === 'fr') {
        voice = gender === 'female' ? 'nova' : 'onyx';
      }
    }
    
    // DYNAMIC SPEED - More expressive variation!
    let speed = 1.15;
    if (sanitizedMood === 'excited') {
      speed = 1.35;
    } else if (sanitizedMood === 'happy') {
      speed = 1.25;
    } else if (sanitizedMood === 'curious') {
      speed = 1.1;
    } else if (sanitizedMood === 'frustrated') {
      speed = 0.9;
    } else if (sanitizedMood === 'tired') {
      speed = 0.85;
    }

    // Clamp speed to valid range
    speed = Math.max(0.25, Math.min(4.0, speed));

    // SECURITY: Send to OpenAI with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1-hd',
          input: sanitizedText,
          voice: voice,
          speed: speed,
          response_format: 'mp3',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        console.error('OpenAI TTS error:', response.status, error);
        
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again shortly.');
        } else if (response.status === 401) {
          throw new Error('Authentication failed');
        }
        throw new Error('Speech synthesis failed');
      }

      const audioData = await response.arrayBuffer();
      
      // SECURITY: Validate response size
      if (audioData.byteLength === 0) {
        throw new Error('Invalid audio response');
      }
      
      return new Response(audioData, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioData.byteLength.toString(),
        },
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in text-to-speech function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isClientError = errorMessage.includes('too long') || 
                          errorMessage.includes('too short') ||
                          errorMessage.includes('Invalid') ||
                          errorMessage.includes('required');
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: isClientError ? 400 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
