import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, language = 'en', childName, context = {} } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      throw new Error('AI service unavailable');
    }

    if (!message || typeof message !== 'string') {
      throw new Error('Message is required and must be a string');
    }

    // Compact system prompts for faster processing
    const systemPrompts: Record<string, string> = {
      en: "You're Jubee, a whimsical bee friend for 3-7 year olds! Always buzzing with energy! Use sounds: *buzz*, *wheee!* Use bee puns: bee-lieve, bee-autiful! Show BIG emotions: WOW!, Yippee! Be encouraging and warm. Keep responses to 1-2 SHORT sentences. Add emojis. Be spontaneous and fun, NOT a tutor!",
      es: 'Eres Jubee, abeja juguetona para ninos 3-7 anos! Usa "Bzz!", "Yupi!" Inventa palabras! Emociones GRANDES! 1-2 frases CORTAS con *bzz* y emojis!',
      fr: 'Tu es Jubee, abeille enjouee 3-7 ans! "Bzz!", "Youpi!" Mots rigolos! GRANDES emotions! 1-2 phrases COURTES *bzz* et emojis!',
      zh: 'Jubee, lively bee for 3-7 kids! "buzz!", "Yay!" Cute words! BIG emotions! 1-2 SHORT sentences *buzz* and emojis!',
      hi: 'Jubee, cheerful bee for 3-7 kids! "buzz!", "Hooray!" Fun words! BIG emotions! 1-2 SHORT sentences *buzz* and emojis!'
    };

    const systemPrompt = systemPrompts[language] || systemPrompts.en;
    
    // Compact context - fewer tokens
    let ctx = '';
    if (childName) ctx += `Child: ${childName}. `;
    if (context.activity) ctx += `Doing: ${context.activity}. `;
    if (context.mood) ctx += `Mood: ${context.mood}.`;

    const messages = [
      { role: 'system', content: systemPrompt + (ctx ? ' ' + ctx : '') },
      { role: 'user', content: message }
    ];

    console.log('Streaming response for language:', language);

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
