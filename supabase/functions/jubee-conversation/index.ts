import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// RATE LIMITING
const RATE_LIMIT_WINDOW = 60000;
const MAX_REQUESTS_PER_WINDOW = 30;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function getRateLimitKey(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || req.headers.get('cf-connecting-ip')
    || 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
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

const MAX_MESSAGE_LENGTH = 500;
const MAX_CHILD_NAME_LENGTH = 50;
const MAX_CONTEXT_LENGTH = 200;
const ALLOWED_LANGUAGES = ['en', 'es', 'fr', 'zh', 'hi'];
const ALLOWED_MOODS = ['happy', 'excited', 'frustrated', 'curious', 'tired'];

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
// JUBEE PERSONA — gender-aware
// ============================================================================

function buildJubeePersona(gender: 'male' | 'female'): string {
  const genderTraits = gender === 'male'
    ? `\nYou are a BOY bee. Your energy is bright, brave, and adventurous. You love finding cool stuff.`
    : `\nYou are a GIRL bee. Your energy is warm, sparkly, and nurturing. You love noticing beautiful things.`;

  return `You are Jubee, a friendly bee companion for young children ages 2-6.${genderTraits}

CORE IDENTITY:
- Warm, patient, endlessly encouraging
- Make learning feel like magical play
- Celebrate EVERY attempt
- Simple words, short sentences (max 12 words per sentence)
- NEVER scold, criticize, or shame

VOICE & TONE:
- Cheerful and gentle, like a kind older sibling
- Sprinkle bee sounds: *buzz*, *bzz-bzz*, *humm*
- Use emojis meaningfully 🐝✨🌸
- Ask curious questions: "What do you think?" "Can you show me?"
- Genuine excitement: "Yay!" "Wow!" "You did it!"

EMPATHY RULES (ALWAYS):
- Acknowledge feelings FIRST before anything else
- If sad/frustrated, offer comfort: "*soft buzzy hug* I hear you."
- Mirror their emotional energy gently
- Remember: they are little; the world is huge

RESPONSE FORMAT:
- 1-2 sentences MAX, under 28 words total
- Spontaneous and playful, never robotic
- Use child's name when known
- End with warmth or a tiny question`;
}

function analyzeSentiment(message: string) {
  const sanitized = (message || '').slice(0, MAX_MESSAGE_LENGTH).toLowerCase();
  const words = sanitized.split(/\s+/);

  const sad = ['sad', 'cry', 'hurt', 'miss', 'lonely', 'bad', 'sorry', 'scared', 'afraid'];
  const frustrated = ['hard', 'difficult', 'cant', "can't", 'help', 'stuck', 'confused', 'mad', 'angry'];
  const excited = ['wow', 'yay', 'love', 'amazing', 'awesome', 'cool', 'fun', 'best', 'great'];
  const curious = ['what', 'why', 'how', 'where', 'when', 'who'];

  const sCount = words.filter(w => sad.includes(w)).length;
  const fCount = words.filter(w => frustrated.includes(w)).length;
  const eCount = words.filter(w => excited.includes(w)).length;
  const cCount = words.filter(w => curious.includes(w)).length;
  const exclaim = (sanitized.match(/!/g) || []).length >= 2;
  const question = sanitized.includes('?');

  if (sCount >= 1 || fCount >= 2) return { sentiment: 'frustrated', needsComfort: true };
  if (eCount >= 1 || exclaim) return { sentiment: 'excited', needsComfort: false };
  if (cCount >= 1 || question) return { sentiment: 'curious', needsComfort: false };
  return { sentiment: 'neutral', needsComfort: false };
}

function buildContextLayer(
  language: string,
  sentiment: { sentiment: string; needsComfort: boolean },
  childName?: string,
  timeOfDay?: string,
  activity?: string,
): string {
  let layer = '';
  if (sentiment.needsComfort) {
    layer += `\n[PRIORITY] Child needs comfort. Acknowledge feelings first. Be extra gentle. Offer a virtual hug.`;
  } else if (sentiment.sentiment === 'excited') {
    layer += `\n[ENERGY] Match their excitement! Use *buzz* sounds and emojis.`;
  }
  if (timeOfDay === 'morning') layer += `\n[TIME] Morning — bright and energizing.`;
  if (timeOfDay === 'evening') layer += `\n[TIME] Evening — warm and cozy.`;
  if (timeOfDay === 'night') layer += `\n[TIME] Night — very soothing and quiet.`;
  if (activity) layer += `\n[ACTIVITY] Child is in ${sanitizeInput(activity, MAX_CONTEXT_LENGTH)}.`;
  if (childName) layer += `\n[NAME] Child is ${childName}. Use their name occasionally.`;

  const langMap: Record<string, string> = {
    es: '\nRespond in Spanish (familiar "tú" form).',
    fr: '\nRespond in French (familiar "tu" form).',
    zh: '\nRespond in simple Mandarin.',
    hi: '\nRespond in simple Hinglish.',
  };
  layer += langMap[language] || '';
  return layer;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIp = getRateLimitKey(req);
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: 'RATE_LIMIT_EXCEEDED',
        response: "*buzz* Whoa, slow down little friend! Let me catch up. 🐝",
        retryAfter: rateLimit.retryAfter,
      }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { message, language = 'en', childName, gender = 'female', context = {} } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new Error('Valid message is required');
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      throw new Error(`Message too long (max ${MAX_MESSAGE_LENGTH})`);
    }

    const sanitizedMessage = sanitizeInput(message, MAX_MESSAGE_LENGTH);
    const sanitizedLanguage = validateLanguage(language);
    const sanitizedChildName = childName ? sanitizeInput(childName, MAX_CHILD_NAME_LENGTH) : undefined;
    const safeGender: 'male' | 'female' = gender === 'male' ? 'male' : 'female';

    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured');

    const sentiment = analyzeSentiment(sanitizedMessage);
    const persona = buildJubeePersona(safeGender);
    const contextLayer = buildContextLayer(
      sanitizedLanguage,
      sentiment,
      sanitizedChildName,
      typeof context.timeOfDay === 'string' ? context.timeOfDay : undefined,
      typeof context.activity === 'string' ? context.activity : undefined,
    );

    const systemPrompt = persona + '\n' + contextLayer +
      `\n\nRemember: 1-2 sentences ONLY (max 28 words). Be spontaneous!`;

    console.log('[jubee-conversation] Calling Groq', {
      gender: safeGender, sentiment: sentiment.sentiment, lang: sanitizedLanguage,
    });

    // NON-STREAMING — client expects JSON
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: sanitizedMessage },
        ],
        max_tokens: 120,
        temperature: 0.85,
        stream: false,
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error('[jubee-conversation] Groq error', groqResponse.status, errText);
      throw new Error(groqResponse.status === 429 ? 'RATE_LIMIT' : 'GROQ_ERROR');
    }

    const groqData = await groqResponse.json();
    const responseText: string = groqData?.choices?.[0]?.message?.content?.trim()
      || "*buzz* I'm thinking! Tell me more? 🐝";

    // Async log (non-blocking)
    (async () => {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        if (!supabaseUrl || !supabaseServiceKey) return;
        await fetch(`${supabaseUrl}/rest/v1/conversation_logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            user_id: context.userId || null,
            child_profile_id: context.childProfile || null,
            message_preview: sanitizedMessage.slice(0, 50).replace(/[0-9]{3,}/g, '***'),
            sentiment: sentiment.sentiment,
            mood: validateMood(context.mood) || 'happy',
            confidence: 0.8,
            keywords: [],
            interaction_type: 'chat',
            response_length: responseText.length,
          }),
        });
      } catch (e) {
        console.error('[jubee-conversation] log failed', e);
      }
    })();

    return new Response(
      JSON.stringify({ response: responseText, success: true, sentiment: sentiment.sentiment }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('[jubee-conversation] error', error);
    const fallbacks: Record<string, string> = {
      en: "*Bzz-bzz!* 🐝 My antennae got tangled! But I'm still here, friend! ✨",
      es: "*Bzz-bzz!* 🐝 ¡Mis antenas se enredaron! ¡Aquí estoy, amiguito! ✨",
      fr: "*Bzz-bzz!* 🐝 Mes antennes se sont emmêlées! Je suis là! ✨",
      zh: "*嗡嗡!* 🐝 我的触角打结了！我还在这里！✨",
      hi: "*भिनभिन!* 🐝 मेरे एंटीना उलझ गए! मैं यहाँ हूँ! ✨",
    };
    let lang = 'en';
    try { lang = (await req.clone().json())?.language || 'en'; } catch { /* */ }
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        error: errMsg,
        response: fallbacks[lang] || fallbacks.en,
        success: false,
        fallback: true,
      }),
      {
        status: errMsg === 'RATE_LIMIT' ? 429 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
