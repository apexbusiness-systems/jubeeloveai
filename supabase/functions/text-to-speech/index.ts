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
    const { text, gender, language = 'en', mood = 'happy' } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Select voice based on mood and gender for emotional expressiveness
    let voice = 'shimmer'; // Default playful female voice
    
    if (mood === 'excited') {
      voice = gender === 'female' ? 'shimmer' : 'fable';
    } else if (mood === 'happy') {
      voice = gender === 'female' ? 'shimmer' : 'fable';
    } else if (mood === 'curious') {
      voice = gender === 'female' ? 'nova' : 'onyx';
    } else if (mood === 'frustrated' || mood === 'tired') {
      voice = gender === 'female' ? 'nova' : 'echo';
    } else {
      voice = gender === 'female' ? 'shimmer' : 'fable';
    }
    
    // Adjust voice for better clarity in certain languages
    if (language === 'zh' || language === 'hi') {
      voice = 'shimmer';
    }
    
    // Dynamic speed based on mood
    let speed = 1.15; // Default
    if (mood === 'excited') {
      speed = 1.3;
    } else if (mood === 'happy') {
      speed = 1.2;
    } else if (mood === 'curious') {
      speed = 1.1;
    } else if (mood === 'frustrated') {
      speed = 0.95;
    } else if (mood === 'tired') {
      speed = 0.9;
    }

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1-hd',
        input: text,
        voice: voice,
        speed: speed,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI TTS error:', error);
      throw new Error('Failed to generate speech');
    }

    const audioData = await response.arrayBuffer();
    
    return new Response(audioData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error('Error in text-to-speech function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
