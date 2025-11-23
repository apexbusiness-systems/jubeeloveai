import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// RATE LIMITING: IP-based protection against abuse
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute per IP (stricter for audio processing)
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
const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB max (Whisper API limit)
const MIN_AUDIO_SIZE = 100; // Minimum reasonable audio size

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768): Uint8Array {
  // SECURITY: Validate input
  if (!base64String || typeof base64String !== 'string') {
    throw new Error('Invalid audio data format');
  }

  // SECURITY: Size check before processing
  const estimatedSize = (base64String.length * 3) / 4;
  if (estimatedSize > MAX_AUDIO_SIZE) {
    throw new Error(`Audio file too large (max ${MAX_AUDIO_SIZE / 1024 / 1024}MB)`);
  }
  if (estimatedSize < MIN_AUDIO_SIZE) {
    throw new Error('Audio file too small or corrupted');
  }

  const chunks: Uint8Array[] = [];
  let position = 0;
  
  try {
    while (position < base64String.length) {
      const chunk = base64String.slice(position, position + chunkSize);
      const binaryChunk = atob(chunk);
      const bytes = new Uint8Array(binaryChunk.length);
      
      for (let i = 0; i < binaryChunk.length; i++) {
        bytes[i] = binaryChunk.charCodeAt(i);
      }
      
      chunks.push(bytes);
      position += chunkSize;
    }
  } catch (error) {
    console.error('Base64 decoding error:', error);
    throw new Error('Invalid audio encoding');
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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
    // SECURITY: Parse with error handling and timeout
    let body;
    try {
      body = await req.json();
    } catch {
      throw new Error('Invalid JSON payload');
    }

    const { audio } = body;
    
    // SECURITY: Validate audio data
    if (!audio || typeof audio !== 'string') {
      throw new Error('Valid audio data is required');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      throw new Error('Speech recognition service unavailable');
    }

    // SECURITY: Process audio with validation
    let binaryAudio: Uint8Array;
    try {
      binaryAudio = processBase64Chunks(audio);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Audio processing failed';
      throw new Error(message);
    }
    
    // Prepare form data
    const formData = new FormData()
    const blob = new Blob([binaryAudio as BlobPart], { type: 'audio/webm' })
    formData.append('file', blob, 'audio.webm')
    formData.append('model', 'whisper-1')

    // SECURITY: Send to OpenAI with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again shortly.');
        } else if (response.status === 401) {
          throw new Error('Authentication failed');
        }
        throw new Error('Speech recognition failed');
      }

      const result = await response.json();

      // SECURITY: Validate response
      if (!result.text || typeof result.text !== 'string') {
        throw new Error('Invalid response from speech service');
      }

      return new Response(
        JSON.stringify({ text: result.text }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout. Please try with a shorter recording.');
      }
      throw error;
    }

  } catch (error) {
    console.error('Speech-to-text error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isClientError = errorMessage.includes('too large') || 
                          errorMessage.includes('too small') ||
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
})
