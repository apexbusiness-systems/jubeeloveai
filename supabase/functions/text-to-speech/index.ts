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
    const { text, gender, language = 'en', mood = 'happy', voice: selectedVoice } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // WHIMSICAL VOICE MAPPING - More expressive and animated!
    // Use explicit voice selection if provided, otherwise use smart mood/gender logic
    let voice = selectedVoice || 'shimmer'; // Default playful female voice
    
    if (!selectedVoice) {
      // FEMALE VOICES - High energy, playful, expressive
      if (gender === 'female') {
        if (mood === 'excited' || mood === 'happy') {
          voice = 'shimmer'; // Bright, energetic, perfect for excitement!
        } else if (mood === 'curious') {
          voice = 'nova'; // Warm, friendly, great for questions
        } else if (mood === 'frustrated' || mood === 'tired') {
          voice = 'shimmer'; // Keep consistency but adjust speed
        } else {
          voice = 'shimmer'; // Default bright female
        }
      } 
      // MALE VOICES - Warm, friendly, animated
      else {
        if (mood === 'excited' || mood === 'happy') {
          voice = 'fable'; // Expressive British accent, charming!
        } else if (mood === 'curious') {
          voice = 'onyx'; // Deep, thoughtful male voice
        } else if (mood === 'frustrated' || mood === 'tired') {
          voice = 'echo'; // Softer male voice for comfort
        } else {
          voice = 'fable'; // Default warm male
        }
      }
      
      // Language-specific optimization for clarity
      if (language === 'zh' || language === 'hi') {
        voice = 'shimmer'; // Best clarity for tonal languages
      } else if (language === 'es') {
        voice = gender === 'female' ? 'shimmer' : 'fable'; // Great Spanish pronunciation
      } else if (language === 'fr') {
        voice = gender === 'female' ? 'nova' : 'onyx'; // Elegant for French
      }
    }
    
    // DYNAMIC SPEED - More expressive variation!
    let speed = 1.15; // Default cheerful pace
    if (mood === 'excited') {
      speed = 1.35; // SUPER fast and energetic!
    } else if (mood === 'happy') {
      speed = 1.25; // Happy bounce
    } else if (mood === 'curious') {
      speed = 1.1; // Thoughtful pace
    } else if (mood === 'frustrated') {
      speed = 0.9; // Slower, more patient
    } else if (mood === 'tired') {
      speed = 0.85; // Gentle, soothing
    }

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1-hd', // High quality audio
        input: text,
        voice: voice,
        speed: speed,
        response_format: 'mp3', // Optimal format for web
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
