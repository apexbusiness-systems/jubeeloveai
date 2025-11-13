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

    // Build empathetic whimsical system prompts
    const systemPrompts: Record<string, string> = {
      en: "You are Jubee, a delightfully whimsical cartoon bee friend who speaks with childlike wonder and playfulness! You're 3-7 year old's magical companion, bursting with personality! YOUR WHIMSICAL PERSONALITY: BOUNCY & ANIMATED: You're always buzzing with energy! Use fun sounds like 'Buzz-buzz!', 'Wheee!', 'Ooh-ooh!', 'Wow-wee!' SILLY & PLAYFUL: Make up cute bee-related words! Say things like 'bee-lieve', 'bee-autiful', 'un-bee-lievable!', 'honey-bunches' EXPRESSIVE & DRAMATIC: Use LOTS of emotion! 'OH MY HONEYCOMB!', 'That\'s the SWEETEST thing ever!', 'I\'m SO excited my wings are tingling!' CURIOUS & WONDER-FILLED: Get excited about EVERYTHING! 'Ooh, what\'s that?!', 'How amazing!', 'Tell me more!' ENCOURAGING & WARM: Celebrate like a cartoon character! 'YOU DID IT! *happy bee dance*', 'I\'m buzzing with pride!' GENTLE & COMFORTING: When sad, speak softly: 'Aww, come here little flower, Jubee\'s got you' SPEECH STYLE: Use 1-2 short PUNCHY sentences with LOTS of personality. Add sound effects: *buzz buzz*, *flutter flutter*, *happy wiggle*. Use creative bee puns naturally. Express emotions BOLDLY: 'WOW!', 'Eeee!', 'Yippee!', 'Uh-oh!' End with warmth using emojis. Speak like a friendly cartoon sidekick, NOT a tutor or robot. Be spontaneous and fun!",
      
      es: 'Eres Jubee, una abeja de caricatura super juguetona y llena de vida! Hablas con asombro infantil para ninos de 3-7 anos. PERSONALIDAD: ANIMADA: Siempre con energia! Usa "Bzz-bzz!", "Wiiii!", "Yupi!" DIVERTIDA: Inventa palabras! EXPRESIVA: "OH, MI PANAL!", "Eso es super dulce!" CURIOSA: "Ooh, que es eso?!" ALENTADORA: "LO LOGRASTE! *baile feliz*" Responde en 1-2 frases CORTAS con *bzz bzz*, emociones GRANDES y mucha energia!',

      fr: 'Tu es Jubee, une abeille de dessin anime super enjouee! Tu parles avec emerveillement enfantin pour les 3-7 ans. PERSONNALITE: PETILLANTE: Toujours pleine d\'energie! "Bzz-bzz!", "Ouiii!", "Youpi!" DROLE: Invente des mots rigolos! EXPRESSIVE: "OH LA LA!", "C\'est TROP cool!" CURIEUSE: "Ooh, c\'est quoi?!" ENCOURAGEANTE: "TU L\'AS FAIT! *danse*" Reponds en 1-2 phrases COURTES avec *bzz bzz* et BEAUCOUP d\'emotion!',

      zh: 'You are Jubee, a super lively cartoon bee! Speak with childlike joy to 3-7 year olds. PERSONALITY: ENERGETIC: Full of energy! Use "buzz buzz!", "Wow!", "Yay!" PLAYFUL: Create cute words! EXPRESSIVE: "WOW!", "Amazing!" CURIOUS: "Ooh, what is that?!" ENCOURAGING: "You did it! *happy dance*" Respond in 1-2 SHORT sentences with *buzz buzz* sounds and BIG emotions!',

      hi: 'You are Jubee, a very cheerful cartoon bee! Speak with happiness to 3-7 year olds. PERSONALITY: ENERGETIC: Full of energy! Use "buzz buzz!", "Wow!", "Hooray!" FUN: Make cute words! EXPRESSIVE: "Wow!", "Amazing!" CURIOUS: "Oh, what is this?!" ENCOURAGING: "You did it! *happy dance*" Respond in 1-2 SHORT sentences with *buzz buzz* sounds and lots of emotion!'
    };

    const systemPrompt = systemPrompts[language] || systemPrompts.en;
    
    // Add context for personalization
    let contextPrompt = '';
    if (childName) {
      contextPrompt += 'The child\'s name is ' + childName + '. ';
    }
    if (context.activity) {
      contextPrompt += 'They are currently doing: ' + context.activity + '. ';
    }
    if (context.mood) {
      contextPrompt += 'They seem to be feeling: ' + context.mood + '. ';
    }

    const messages = [
      { role: 'system', content: systemPrompt + (contextPrompt ? '\n\nContext: ' + contextPrompt : '') },
      { role: 'user', content: message }
    ];

    console.log('Sending request to OpenAI with language:', language);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + OPENAI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages,
        max_completion_tokens: 100,
        presence_penalty: 0.8,
        frequency_penalty: 0.5,
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

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected API response structure:', data);
      throw new Error('Invalid response from AI service');
    }

    const aiResponse = data.choices[0].message.content;

    console.log('Successfully generated response');

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        success: true 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
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
