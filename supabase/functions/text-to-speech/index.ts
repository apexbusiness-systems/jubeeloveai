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
const MAX_TEXT_LENGTH = 4096;
const MIN_TEXT_LENGTH = 1;
const ALLOWED_MOODS = ['happy', 'excited', 'frustrated', 'curious', 'tired'];
const ALLOWED_LANGUAGES = ['en', 'es', 'fr', 'zh', 'hi'];
const ALLOWED_TIMES = ['morning', 'afternoon', 'evening', 'night'];

// ElevenLabs Voice IDs - Custom Jubee voices
const JUBEE_VOICES = {
  jubee: 'XJ2fW4ybq7HouelYYGcL',      // Primary Jubee voice - warm, child-friendly
  jubeeDude: 'DTKMou8ccj1ZaWGBiotd',  // Jubee Dude voice
};

// Default voice - use primary Jubee for warmth
const JUBEE_VOICE_ID = JUBEE_VOICES.jubee;

function sanitizeText(text: string): string {
  if (typeof text !== 'string') return '';
  return text
    .slice(0, MAX_TEXT_LENGTH)
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .trim();
}

function validateMood(mood: string): string {
  return ALLOWED_MOODS.includes(mood) ? mood : 'happy';
}

function validateLanguage(lang: string): string {
  return ALLOWED_LANGUAGES.includes(lang) ? lang : 'en';
}

function validateTimeOfDay(time: string): string | undefined {
  return ALLOWED_TIMES.includes(time) ? time : undefined;
}

// ElevenLabs TTS with Jubee voice - balanced, child-friendly
async function synthesizeWithElevenLabs(
  text: string,
  mood: string,
  _language: string,
  timeOfDay?: string
): Promise<ArrayBuffer | null> {
  const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
  
  if (!ELEVENLABS_API_KEY) {
    console.log('ElevenLabs API key not configured, falling back to OpenAI');
    return null;
  }

  // Use custom Jubee voice
  const voiceId = JUBEE_VOICE_ID;

  // Voice settings tuned for warm, expressive, child-friendly delivery
  // Lower stability = more natural variation (less robotic)
  // Higher style = more expressive emotion
  let stability = 0.25;         // Lower for more natural variation
  const similarityBoost = 0.85; // Strong voice character
  let style = 0.60;             // Higher expressiveness
  
  // Mood-based adjustments - prioritize expressiveness
  if (mood === 'excited') {
    stability = 0.18;     // Maximum variation for excitement
    style = 0.80;         // Very expressive
  } else if (mood === 'happy') {
    stability = 0.22;
    style = 0.70;
  } else if (mood === 'curious') {
    stability = 0.28;
    style = 0.65;
  } else if (mood === 'frustrated') {
    stability = 0.35;     // Slightly more stable for gentle reassurance
    style = 0.50;         // Still warm
  } else if (mood === 'tired') {
    stability = 0.40;     // More stable for soothing
    style = 0.40;         // Gentle but warm
  }

  // Time-of-day energy adjustments
  if (timeOfDay === 'night') {
    stability = Math.min(stability + 0.15, 0.7);  // More stable at night
    style = Math.max(style - 0.15, 0.2);          // Gentler delivery
  } else if (timeOfDay === 'evening') {
    stability = Math.min(stability + 0.08, 0.6);  // Slightly calmer
    style = Math.max(style - 0.08, 0.3);
  } else if (timeOfDay === 'morning') {
    style = Math.min(style + 0.05, 0.7);          // Slightly more energetic
  }

  try {
    console.log(`ElevenLabs TTS: voice=jubee, mood=${mood}, stability=${stability}, style=${style}`);
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_turbo_v2_5', // Fast, high-quality multilingual
          voice_settings: {
            stability: stability,
            similarity_boost: similarityBoost,
            style: style,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs error:', response.status, errorText);
      return null; // Fall back to OpenAI
    }

    const audioData = await response.arrayBuffer();
    console.log('ElevenLabs TTS success, audio size:', audioData.byteLength);
    return audioData;
  } catch (error) {
    console.error('ElevenLabs TTS failed:', error);
    return null; // Fall back to OpenAI
  }
}

// Preprocess text for more natural speech
function preprocessTextForSpeech(text: string, mood: string): string {
  let processed = text;
  
  // Add natural pauses with commas and ellipses
  processed = processed.replace(/\. /g, '... ');
  processed = processed.replace(/! /g, '!... ');
  processed = processed.replace(/\? /g, '?... ');
  
  // Add emphasis for excitement
  if (mood === 'excited' || mood === 'happy') {
    // Add slight pause before exclamations
    processed = processed.replace(/!/g, '!');
  }
  
  // Add breathing pauses for tired mood
  if (mood === 'tired') {
    processed = processed.replace(/,/g, ',... ');
  }
  
  return processed;
}

// OpenAI TTS fallback - optimized for natural sound
async function synthesizeWithOpenAI(
  text: string,
  mood: string,
  gender: string | undefined,
  language: string
): Promise<ArrayBuffer> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  
  if (!OPENAI_API_KEY) {
    throw new Error('Speech synthesis service unavailable');
  }

  // Use 'alloy' for most natural, warm sound - it's the most human-like
  // 'nova' for curious/questioning - slightly more animated
  // 'shimmer' for gentle/tired - soft and soothing
  let voice = 'alloy'; // Default - most natural sounding
  
  if (mood === 'curious') {
    voice = 'nova'; // More animated, questioning tone
  } else if (mood === 'tired' || mood === 'frustrated') {
    voice = 'shimmer'; // Softer, gentler
  } else if (gender === 'male') {
    voice = 'echo'; // Natural male voice
  }
  
  // Language-specific - alloy works well across languages
  if (language === 'zh' || language === 'hi') {
    voice = 'alloy'; // Best multilingual support
  }
  
  // Speed based on mood - keep closer to 1.0 for natural sound
  let speed = 1.0; // Natural pace
  if (mood === 'excited') speed = 1.15;
  else if (mood === 'happy') speed = 1.08;
  else if (mood === 'curious') speed = 1.0;
  else if (mood === 'frustrated') speed = 0.95;
  else if (mood === 'tired') speed = 0.9;
  
  // Clamp speed to valid range
  speed = Math.max(0.25, Math.min(4.0, speed));

  // Preprocess text for more natural delivery
  const processedText = preprocessTextForSpeech(text, mood);

  console.log('OpenAI TTS fallback: voice=', voice, 'speed=', speed);

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1-hd', // HD model for better quality
      input: processedText,
      voice: voice,
      speed: speed,
      response_format: 'mp3',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenAI TTS error:', response.status, error);
    throw new Error('Speech synthesis failed');
  }

  return response.arrayBuffer();
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

    const { text, gender, language = 'en', mood = 'happy', timeOfDay } = body;
    
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
    const sanitizedTimeOfDay = timeOfDay ? validateTimeOfDay(timeOfDay) : undefined;

    // Try ElevenLabs first (custom Jubee voice)
    let audioData = await synthesizeWithElevenLabs(
      sanitizedText,
      sanitizedMood,
      sanitizedLanguage,
      sanitizedTimeOfDay
    );

    // Fall back to OpenAI if ElevenLabs fails
    if (!audioData) {
      console.log('Falling back to OpenAI TTS');
      audioData = await synthesizeWithOpenAI(
        sanitizedText,
        sanitizedMood,
        gender,
        sanitizedLanguage
      );
    }
    
    if (!audioData || audioData.byteLength === 0) {
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
