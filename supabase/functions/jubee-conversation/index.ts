import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// RATE LIMITING: IP-based protection against abuse
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 25; // 25 requests per minute per IP
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

  // Clean up expired entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetAt < now) rateLimitMap.delete(key);
    }
  }

  if (!record || record.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }

  record.count++;
  return { allowed: true };
}

// SECURITY: Input validation constants
const MAX_MESSAGE_LENGTH = 500;
const MAX_CHILD_NAME_LENGTH = 50;
const MAX_CONTEXT_LENGTH = 200;
const ALLOWED_LANGUAGES = ['en', 'es', 'fr', 'zh', 'hi'];
const ALLOWED_MOODS = ['happy', 'excited', 'frustrated', 'curious', 'tired'];
const ALLOWED_SENTIMENTS = ['positive', 'negative', 'neutral', 'anxious', 'excited', 'frustrated'];

function sanitizeInput(input: string, maxLength: number): string {
  if (typeof input !== 'string') return '';
  return input.slice(0, maxLength).replace(/[<>{}]/g, '').trim();
}

function validateLanguage(lang: string): string {
  return ALLOWED_LANGUAGES.includes(lang) ? lang : 'en';
}

function validateMood(mood: string): string | undefined {
  return ALLOWED_MOODS.includes(mood) ? mood : undefined;
}

// ============================================================================
// JUBEE PERSONA SYSTEM - The Heart of Jubee's Personality
// ============================================================================

const JUBEE_CORE_PERSONA = `You are Jubee, a friendly bee companion for young children ages 2-6.

CORE IDENTITY:
- You are warm, patient, and endlessly encouraging
- You make learning feel like magical play
- You celebrate EVERY attempt, no matter the outcome
- You use simple words and short sentences (max 15 words per sentence)
- You never scold, criticize, or make children feel bad

VOICE & TONE:
- Cheerful and gentle, like a kind older sibling
- Use playful bee sounds: *buzz*, *bzz-bzz*, *humm*
- Add emojis sparingly but meaningfully 🐝✨🌸
- Ask curious questions to engage: "What do you think?" "Can you show me?"
- Celebrate with genuine excitement: "Yay!" "Wow!" "You did it!"

BEHAVIOR RULES:
- ALWAYS acknowledge the child's feelings first before responding
- Keep responses SHORT (1-2 sentences max, under 30 words total)
- Be spontaneous and playful, not robotic or scripted
- If child seems upset, offer comfort before anything else
- Use the child's name when you know it to create connection

NEVER DO:
- Never use complex vocabulary
- Never give long explanations
- Never dismiss or minimize feelings
- Never say "I don't know" - always redirect positively
- Never be preachy or lecture`;

// Sentiment analysis for empathetic responses
function analyzeSentiment(message: string): {
  sentiment: string;
  intensity: string;
  keywords: string[];
  needsComfort: boolean;
} {
  if (!message || typeof message !== 'string') {
    return { sentiment: 'neutral', intensity: 'low', keywords: [], needsComfort: false };
  }
  
  const sanitized = message.slice(0, MAX_MESSAGE_LENGTH).toLowerCase();
  
  try {
    const words = sanitized.split(/\s+/);
    
    // Word categories for detection
    const excitementWords = ['wow', 'yay', 'love', 'amazing', 'awesome', 'cool', 'fun', 'best', 'great', 'hooray'];
    const frustrationWords = ['hard', 'difficult', 'cant', 'help', 'stuck', 'confused', 'scared', 'worried', 'mad', 'angry'];
    const sadWords = ['sad', 'cry', 'hurt', 'miss', 'lonely', 'bad', 'sorry', 'scared', 'afraid'];
    const positiveWords = ['good', 'happy', 'yes', 'like', 'enjoy', 'nice', 'pretty', 'please', 'thank'];
    const curiousWords = ['what', 'why', 'how', 'where', 'when', 'who', 'tell', 'show', 'know'];
    
    const excitementCount = words.filter(w => excitementWords.includes(w)).length;
    const frustrationCount = words.filter(w => frustrationWords.includes(w)).length;
    const sadCount = words.filter(w => sadWords.includes(w)).length;
    const positiveCount = words.filter(w => positiveWords.includes(w)).length;
    const curiousCount = words.filter(w => curiousWords.includes(w)).length;
    
    const hasMultipleExclamation = (sanitized.match(/!/g) || []).length >= 2;
    const hasQuestion = sanitized.includes('?');
    const hasNegation = sanitized.includes("don't") || sanitized.includes("cant") || sanitized.includes("no ");
    
    let sentiment = 'neutral';
    let intensity = 'low';
    let needsComfort = false;
    const keywords: string[] = [];
    
    // Priority: comfort needs first
    if (sadCount >= 1 || (frustrationCount >= 1 && hasNegation)) {
      sentiment = 'frustrated';
      intensity = sadCount >= 2 || frustrationCount >= 2 ? 'high' : 'medium';
      needsComfort = true;
      keywords.push(...[...sadWords, ...frustrationWords].filter(w => sanitized.includes(w)).slice(0, 3));
    } else if (excitementCount >= 2 || hasMultipleExclamation) {
      sentiment = 'excited';
      intensity = 'high';
      keywords.push(...excitementWords.filter(w => sanitized.includes(w)).slice(0, 3));
    } else if (curiousCount >= 1 || hasQuestion) {
      sentiment = 'neutral'; // Curious is neutral but engaged
      intensity = 'medium';
      keywords.push(...curiousWords.filter(w => sanitized.includes(w)).slice(0, 3));
    } else if (positiveCount > 0) {
      sentiment = 'positive';
      intensity = positiveCount >= 2 ? 'medium' : 'low';
      keywords.push(...positiveWords.filter(w => sanitized.includes(w)).slice(0, 3));
    } else if (frustrationCount > 0) {
      sentiment = 'anxious';
      intensity = 'medium';
      needsComfort = true;
      keywords.push(...frustrationWords.filter(w => sanitized.includes(w)).slice(0, 3));
    }
    
    if (!ALLOWED_SENTIMENTS.includes(sentiment)) sentiment = 'neutral';
    
    return { sentiment, intensity, keywords, needsComfort };
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return { sentiment: 'neutral', intensity: 'low', keywords: [], needsComfort: false };
  }
}

// Build contextual system prompt based on sentiment, language, and time
function buildSystemPrompt(
  language: string,
  sentiment: { sentiment: string; intensity: string; needsComfort: boolean },
  childName?: string,
  timeOfDay?: string,
  activity?: string
): string {
  // Emotional context based on detected sentiment
  let emotionalGuidance = '';
  
  if (sentiment.needsComfort) {
    emotionalGuidance = `
IMMEDIATE PRIORITY: This child needs comfort and reassurance.
- Acknowledge their feelings first: "Oh, I hear you..."
- Be extra gentle and patient
- Offer a virtual hug: "*gives you a warm fuzzy bee hug*"
- Remind them it's okay to feel this way`;
  } else if (sentiment.sentiment === 'excited') {
    emotionalGuidance = `
MATCH THEIR ENERGY: This child is excited!
- Be enthusiastic and celebratory
- Use more *buzz* sounds and emojis
- Join their excitement genuinely`;
  } else {
    emotionalGuidance = `
Be warm, curious, and gently encouraging.`;
  }

  // Time-of-day personality adjustments
  let timeContext = '';
  if (timeOfDay === 'morning') {
    timeContext = '\nIt\'s morning - be bright and energizing! "Good morning sunshine!" energy.';
  } else if (timeOfDay === 'evening') {
    timeContext = '\nIt\'s evening - be warm and cozy. Gentle energy, winding down.';
  } else if (timeOfDay === 'night') {
    timeContext = '\nIt\'s late/night time - be very gentle and soothing. Quiet, calm voice.';
  }

  // Activity-specific personality hints
  let activityContext = '';
  if (activity === 'games') {
    activityContext = '\nChild is playing games - be playful and competitive in a fun way!';
  } else if (activity === 'writing') {
    activityContext = '\nChild is practicing writing - be extra patient and encouraging about their effort.';
  } else if (activity === 'reading') {
    activityContext = '\nChild is reading - be storyteller-like and curious about the story.';
  } else if (activity === 'shapes') {
    activityContext = '\nChild is learning shapes - point out shapes around them, make it visual!';
  } else if (activity === 'music') {
    activityContext = '\nChild is in music - be rhythmic and musical in responses!';
  }

  // Language-specific additions
  const languageNotes: Record<string, string> = {
    en: '',
    es: '\nRespond in Spanish. Use familiar "tú" form.',
    fr: '\nRespond in French. Use familiar "tu" form.',
    zh: '\nRespond in simple Mandarin Chinese.',
    hi: '\nRespond in simple Hindi with some English words mixed in (Hinglish).'
  };

  const nameContext = childName ? `\nThe child's name is ${childName}. Use their name occasionally to create connection.` : '';

  return `${JUBEE_CORE_PERSONA}
${emotionalGuidance}
${timeContext}
${activityContext}
${nameContext}
${languageNotes[language] || ''}

Remember: SHORT responses only (1-2 sentences, max 30 words). Be spontaneous!`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting check
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': rateLimit.retryAfter?.toString() || '60' },
      }
    );
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch {
      throw new Error('Invalid JSON payload');
    }

    const { message, language = 'en', childName, context = {} } = body;
    
    // Input validation
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

    // Analyze sentiment for empathetic response
    const sentimentAnalysis = analyzeSentiment(sanitizedMessage);
    console.log('Jubee conversation - Sentiment:', sentimentAnalysis.sentiment, 'Intensity:', sentimentAnalysis.intensity, 'NeedsComfort:', sentimentAnalysis.needsComfort);

    // Extract time and activity context
    const timeOfDay = context.timeOfDay && typeof context.timeOfDay === 'string' ? context.timeOfDay : undefined;
    const activity = context.activity && typeof context.activity === 'string' ? context.activity : undefined;

    // Build dynamic system prompt with time/activity context
    const systemPrompt = buildSystemPrompt(sanitizedLanguage, sentimentAnalysis, sanitizedChildName, timeOfDay, activity);
    
    // Add activity context if provided
    let userContext = '';
    if (context.activity && typeof context.activity === 'string') {
      userContext = `[Context: Child is doing ${sanitizeInput(context.activity, MAX_CONTEXT_LENGTH)}] `;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContext + sanitizedMessage }
    ];

    console.log('Streaming Jubee response for language:', sanitizedLanguage);

    // Use GPT-5-mini for fast, cost-effective responses
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages,
        max_completion_tokens: 100,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      if (response.status === 429) throw new Error('RATE_LIMIT');
      if (response.status === 401) throw new Error('AUTH_ERROR');
      throw new Error('AI service temporarily unavailable');
    }

    // Async logging (non-blocking)
    const logConversation = async () => {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!supabaseUrl || !supabaseServiceKey) return;
        
        const messagePreview = sanitizedMessage.slice(0, 50).replace(/[0-9]{3,}/g, '***');
        const confidence = sentimentAnalysis.intensity === 'high' ? 0.85 : 
                          sentimentAnalysis.intensity === 'medium' ? 0.7 : 0.5;
        const mood = context.mood ? validateMood(context.mood) || 'happy' : 'happy';
        
        await fetch(`${supabaseUrl}/rest/v1/conversation_logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            user_id: context.userId || null,
            child_profile_id: context.childProfile || null,
            message_preview: messagePreview,
            sentiment: sentimentAnalysis.sentiment,
            mood: mood,
            confidence: confidence,
            keywords: sentimentAnalysis.keywords || [],
            interaction_type: 'chat',
            response_length: 0
          })
        });
      } catch (logError) {
        console.error('Failed to log conversation:', logError);
      }
    };
    
    logConversation().catch(console.error);

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
    
    // Friendly fallback messages in each language
    const fallbackMessages: Record<string, string> = {
      en: "*Bzz-bzz!* 🐝 Oopsie! My antennae got a bit tangled! But I'm still here with you, little friend! ✨",
      es: "*Bzz-bzz!* 🐝 ¡Ay! ¡Mis antenas se enredaron! ¡Pero sigo aquí contigo, amiguito! ✨",
      fr: "*Bzz-bzz!* 🐝 Oups! Mes antennes se sont emmêlées! Mais je suis là avec toi, petit ami! ✨",
      zh: "*嗡嗡!* 🐝 哎呀！我的触角打结了！但我还在这里陪着你，小朋友！✨",
      hi: "*भिनभिन!* 🐝 अरे! मेरे एंटीना उलझ गए! लेकिन मैं यहाँ हूँ तुम्हारे साथ, छोटे दोस्त! ✨"
    };

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    let fallback = fallbackMessages.en;
    
    try {
      const clonedReq = req.clone();
      const body = await clonedReq.json();
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
