/**
 * useDanceSoundEffects Hook
 * 
 * Manages sound effects for the JubeeDance game.
 * Uses ElevenLabs for generated sounds with Web Audio API fallback.
 */

import { useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

type SoundEffect = 
  | 'perfect'
  | 'good'
  | 'miss'
  | 'countdown_3'
  | 'countdown_2'
  | 'countdown_1'
  | 'start'
  | 'celebrate'
  | 'combo'
  | 'stumble';

interface UseDanceSoundEffectsReturn {
  playPerfect: () => void;
  playGood: () => void;
  playMiss: () => void;
  playCountdown: (count: number) => void;
  playStart: () => void;
  playCelebrate: () => void;
  playCombo: () => void;
  playStumble: () => void;
  preloadSounds: () => Promise<void>;
}

// Cache for audio buffers
const audioCache = new Map<SoundEffect, string>();
const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as Window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)() : null;

export function useDanceSoundEffects(): UseDanceSoundEffectsReturn {
  const isLoadingRef = useRef<Set<SoundEffect>>(new Set());

  // Fetch sound from edge function
  const fetchSound = useCallback(async (type: SoundEffect): Promise<string | null> => {
    // Check cache first
    if (audioCache.has(type)) {
      return audioCache.get(type)!;
    }

    // Prevent duplicate fetches
    if (isLoadingRef.current.has(type)) {
      return null;
    }

    isLoadingRef.current.add(type);

    try {
      logger.dev(`[DanceSFX] Fetching sound: ${type}`);
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || 'https://kphdqgidwipqdthehckg.supabase.co'}/functions/v1/dance-sfx`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwaGRxZ2lkd2lwcWR0aGVoY2tnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMDkyMjYsImV4cCI6MjA3NDU4NTIyNn0.nrq7BccAJKuxU1UKk25w7wBlmCC3b8waskQOpxE-McM',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwaGRxZ2lkd2lwcWR0aGVoY2tnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMDkyMjYsImV4cCI6MjA3NDU4NTIyNn0.nrq7BccAJKuxU1UKk25w7wBlmCC3b8waskQOpxE-McM'}`,
          },
          body: JSON.stringify({ type }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch sound: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.audioContent) {
        audioCache.set(type, data.audioContent);
        logger.dev(`[DanceSFX] Cached sound: ${type}`);
        return data.audioContent;
      }

      return null;
    } catch (error) {
      logger.error(`[DanceSFX] Error fetching ${type}:`, error);
      return null;
    } finally {
      isLoadingRef.current.delete(type);
    }
  }, []);

  // Play a sound using Web Audio API
  const playSound = useCallback(async (type: SoundEffect) => {
    try {
      // Try to get cached or fetch new
      let audioBase64 = audioCache.get(type);
      
      if (!audioBase64) {
        audioBase64 = await fetchSound(type) || undefined;
      }

      if (audioBase64 && audioContext) {
        // Resume audio context if suspended
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        // Decode and play the audio
        const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;
        const audio = new Audio(audioUrl);
        audio.volume = 0.7;
        await audio.play();
      } else {
        // Fallback: Use Web Audio API to generate simple sound
        playFallbackSound(type);
      }
    } catch (error) {
      logger.dev(`[DanceSFX] Playback error for ${type}:`, error);
      // Fallback to generated sound
      playFallbackSound(type);
    }
  }, [fetchSound]);

  // Fallback sound generation using Web Audio API
  const playFallbackSound = useCallback((type: SoundEffect) => {
    if (!audioContext) return;

    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const now = audioContext.currentTime;
      
      switch (type) {
        case 'perfect':
          // Triumphant ascending chord
          oscillator.frequency.setValueAtTime(523.25, now); // C5
          oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
          oscillator.frequency.setValueAtTime(783.99, now + 0.2); // G5
          gainNode.gain.setValueAtTime(0.3, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
          oscillator.start(now);
          oscillator.stop(now + 0.4);
          break;

        case 'good':
          // Pleasant ding
          oscillator.frequency.setValueAtTime(587.33, now); // D5
          oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
          gainNode.gain.setValueAtTime(0.25, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
          oscillator.start(now);
          oscillator.stop(now + 0.25);
          break;

        case 'miss':
        case 'stumble':
          // Gentle descending tone
          oscillator.frequency.setValueAtTime(349.23, now); // F4
          oscillator.frequency.setValueAtTime(293.66, now + 0.15); // D4
          gainNode.gain.setValueAtTime(0.2, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          oscillator.start(now);
          oscillator.stop(now + 0.3);
          break;

        case 'countdown_3':
        case 'countdown_2':
        case 'countdown_1': {
          // Countdown beat
          const pitch = type === 'countdown_1' ? 523.25 : type === 'countdown_2' ? 440 : 392;
          oscillator.frequency.setValueAtTime(pitch, now);
          oscillator.type = 'triangle';
          gainNode.gain.setValueAtTime(0.3, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          oscillator.start(now);
          oscillator.stop(now + 0.3);
          break;
        }

        case 'start':
          // Quick ascending jingle
          oscillator.frequency.setValueAtTime(392, now); // G4
          oscillator.frequency.setValueAtTime(523.25, now + 0.1); // C5
          oscillator.frequency.setValueAtTime(659.25, now + 0.2); // E5
          oscillator.frequency.setValueAtTime(783.99, now + 0.3); // G5
          gainNode.gain.setValueAtTime(0.3, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
          oscillator.start(now);
          oscillator.stop(now + 0.5);
          break;

        case 'celebrate':
          // Victory fanfare
          oscillator.frequency.setValueAtTime(523.25, now); // C5
          oscillator.frequency.setValueAtTime(659.25, now + 0.15); // E5
          oscillator.frequency.setValueAtTime(783.99, now + 0.3); // G5
          oscillator.frequency.setValueAtTime(1046.5, now + 0.45); // C6
          gainNode.gain.setValueAtTime(0.35, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
          oscillator.start(now);
          oscillator.stop(now + 0.7);
          break;

        case 'combo':
          // Quick ascending chime
          oscillator.frequency.setValueAtTime(659.25, now); // E5
          oscillator.frequency.setValueAtTime(880, now + 0.08); // A5
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.25, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          oscillator.start(now);
          oscillator.stop(now + 0.2);
          break;
      }
    } catch (error) {
      logger.dev(`[DanceSFX] Fallback sound error:`, error);
    }
  }, []);

  // Specific sound playback functions
  const playPerfect = useCallback(() => playSound('perfect'), [playSound]);
  const playGood = useCallback(() => playSound('good'), [playSound]);
  const playMiss = useCallback(() => playSound('miss'), [playSound]);
  const playStumble = useCallback(() => playSound('stumble'), [playSound]);
  const playStart = useCallback(() => playSound('start'), [playSound]);
  const playCelebrate = useCallback(() => playSound('celebrate'), [playSound]);
  const playCombo = useCallback(() => playSound('combo'), [playSound]);
  
  const playCountdown = useCallback((count: number) => {
    if (count === 3) playSound('countdown_3');
    else if (count === 2) playSound('countdown_2');
    else if (count === 1) playSound('countdown_1');
  }, [playSound]);

  // Preload common sounds
  const preloadSounds = useCallback(async () => {
    const prioritySounds: SoundEffect[] = ['perfect', 'good', 'miss', 'countdown_3', 'countdown_2', 'countdown_1'];
    
    logger.dev('[DanceSFX] Preloading sounds...');
    
    for (const sound of prioritySounds) {
      await fetchSound(sound);
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    logger.dev('[DanceSFX] Preload complete');
  }, [fetchSound]);

  return {
    playPerfect,
    playGood,
    playMiss,
    playCountdown,
    playStart,
    playCelebrate,
    playCombo,
    playStumble,
    preloadSounds,
  };
}
