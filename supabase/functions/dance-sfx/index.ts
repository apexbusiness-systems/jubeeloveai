/**
 * Dance Sound Effects Edge Function
 * 
 * Generates sound effects for JubeeDance game using ElevenLabs Sound Generation API.
 * Supports: perfect hit, good hit, miss, countdown (3,2,1), and celebration sounds.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Sound effect type definitions
type SoundEffect = 
  | 'perfect'      // Sparkly success sound
  | 'good'         // Positive but lesser sound
  | 'miss'         // Soft "oops" sound
  | 'countdown_3'  // "3" countdown
  | 'countdown_2'  // "2" countdown
  | 'countdown_1'  // "1" countdown
  | 'start'        // Game start jingle
  | 'celebrate'    // Victory celebration
  | 'combo'        // Combo streak sound
  | 'stumble';     // Character stumble sound

// Sound effect prompts for ElevenLabs
const SOUND_PROMPTS: Record<SoundEffect, { prompt: string; duration: number }> = {
  perfect: {
    prompt: "Magical sparkle chime, bright and triumphant, child-friendly game success sound, crystal bells, upward sweep",
    duration: 1.5,
  },
  good: {
    prompt: "Cheerful positive game sound, soft pop with gentle bells, encouraging tone for children",
    duration: 1,
  },
  miss: {
    prompt: "Gentle cartoon wobble sound, soft and playful 'oops', not scary, encouraging for toddlers",
    duration: 1,
  },
  countdown_3: {
    prompt: "Deep drum hit with echo, countdown sound effect, anticipation building, kid-friendly",
    duration: 1,
  },
  countdown_2: {
    prompt: "Medium drum hit with rising tone, countdown sound, excitement building",
    duration: 1,
  },
  countdown_1: {
    prompt: "High drum hit with sparkle finish, final countdown before action, energetic",
    duration: 1,
  },
  start: {
    prompt: "Cheerful game start jingle, magical whoosh with bells, upbeat children's game beginning sound",
    duration: 2,
  },
  celebrate: {
    prompt: "Triumphant victory fanfare, confetti poppers, children's celebration sound, sparkles and cheers",
    duration: 3,
  },
  combo: {
    prompt: "Quick ascending synth notes, combo streak power-up sound, energetic arcade game effect",
    duration: 0.8,
  },
  stumble: {
    prompt: "Cartoon character stumble, soft bouncy wobble, playful trip sound, not scary for children",
    duration: 1.2,
  },
};

// Simple in-memory cache for generated sounds (per cold start)
const soundCache = new Map<SoundEffect, string>();

// Rate limiting
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function getRateLimitKey(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnecting = req.headers.get('cf-connecting-ip');
  return forwarded?.split(',')[0].trim() || realIp || cfConnecting || 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // Clean up old entries
  if (rateLimitMap.size > 5000) {
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

async function generateSoundEffect(type: SoundEffect): Promise<string | null> {
  // Check cache first
  const cached = soundCache.get(type);
  if (cached) {
    console.log(`[dance-sfx] Cache hit for: ${type}`);
    return cached;
  }

  const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
  if (!ELEVENLABS_API_KEY) {
    console.error('[dance-sfx] ELEVENLABS_API_KEY not configured');
    return null;
  }

  const soundConfig = SOUND_PROMPTS[type];
  if (!soundConfig) {
    console.error(`[dance-sfx] Unknown sound type: ${type}`);
    return null;
  }

  try {
    console.log(`[dance-sfx] Generating sound: ${type}`);
    
    const response = await fetch(
      "https://api.elevenlabs.io/v1/sound-generation",
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: soundConfig.prompt,
          duration_seconds: soundConfig.duration,
          prompt_influence: 0.4, // Balanced influence
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[dance-sfx] ElevenLabs error: ${response.status} - ${errorText}`);
      return null;
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = base64Encode(audioBuffer);
    
    // Cache the result
    soundCache.set(type, base64Audio);
    console.log(`[dance-sfx] Generated and cached: ${type} (${audioBuffer.byteLength} bytes)`);
    
    return base64Audio;
  } catch (error) {
    console.error(`[dance-sfx] Error generating ${type}:`, error);
    return null;
  }
}

// Pre-generate common sounds on startup (async, non-blocking)
async function warmupCache() {
  const prioritySounds: SoundEffect[] = ['perfect', 'good', 'miss', 'countdown_3', 'countdown_2', 'countdown_1'];
  
  for (const sound of prioritySounds) {
    try {
      await generateSoundEffect(sound);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`[dance-sfx] Warmup failed for ${sound}:`, error);
    }
  }
}

// Start warmup (fire and forget)
warmupCache().catch(console.error);

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const clientIp = getRateLimitKey(req);
  const rateLimit = checkRateLimit(clientIp);

  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retryAfter: rateLimit.retryAfter,
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Retry-After': rateLimit.retryAfter?.toString() || '60',
        },
      }
    );
  }

  try {
    // Parse request
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { type } = body as { type?: SoundEffect };

    // Validate sound type
    if (!type || !SOUND_PROMPTS[type]) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid sound type', 
          validTypes: Object.keys(SOUND_PROMPTS) 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate or retrieve from cache
    const audioBase64 = await generateSoundEffect(type);

    if (!audioBase64) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate sound effect' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        audioContent: audioBase64,
        type,
        cached: soundCache.has(type),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[dance-sfx] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
