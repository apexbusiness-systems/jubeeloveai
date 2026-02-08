/**
 * JubeeDance Game Hook
 * 
 * React hook for managing the dance game state using the FSM.
 * Includes sound effects integration for enhanced gameplay feedback.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { DanceGameContext, DanceSong, Direction, DanceGameEvent } from './types';
import { 
  createInitialContext, 
  transition, 
  evaluateInput, 
  checkMissedNotes 
} from './DanceGameFSM';
import { logger } from '@/lib/logger';
import { useDanceSoundEffects } from '@/hooks/useDanceSoundEffects';

interface UseDanceGameReturn {
  context: DanceGameContext;
  selectSong: (song: DanceSong) => void;
  startGame: () => void;
  handleInput: (direction: Direction) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  getCurrentLyric: () => string;
  getNextMove: () => { direction: Direction; time: number } | null;
  getTimeToNextMove: () => number;
  playCountdownSound: (count: number) => void;
  playStartSound: () => void;
}

export function useDanceGame(): UseDanceGameReturn {
  const [context, setContext] = useState<DanceGameContext>(createInitialContext);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const gameLoopRef = useRef<number | null>(null);
  
  // Sound effects
  const {
    playPerfect,
    playGood,
    playMiss,
    playCountdown,
    playStart,
    playCelebrate,
    playCombo,
    playStumble,
    preloadSounds,
  } = useDanceSoundEffects();

  // Dispatch event to FSM
  const dispatch = useCallback((event: DanceGameEvent) => {
    setContext((prev) => transition(prev, event));
  }, []);

  // Select a song
  const selectSong = useCallback((song: DanceSong) => {
    dispatch({ type: 'SELECT_SONG', song });
    
    // Preload audio
    if (audioRef.current) {
      audioRef.current.pause();
    }
    audioRef.current = new Audio(song.audioUrl);
    audioRef.current.preload = 'auto';
    
    // Preload sound effects in background
    preloadSounds();
    
    logger.info('[useDanceGame] Song selected:', song.title);
  }, [dispatch, preloadSounds]);

  // Start game immediately (visual countdown is handled by JubeeDance.tsx)
  const startGame = useCallback(() => {
    if (!context.currentSong) {
      logger.warn('[useDanceGame] Cannot start without a song selected');
      return;
    }

    // Transition FSM directly to playing state
    dispatch({ type: 'START_COUNTDOWN' });
    dispatch({ type: 'COUNTDOWN_COMPLETE' });

    // Play start sound
    playStart();

    // Start audio playback
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        logger.error('[useDanceGame] Audio play failed:', err);
      });
    }

    logger.info('[useDanceGame] Game started!');
  }, [context.currentSong, dispatch, playStart]);

  // Expose countdown sound for JubeeDance.tsx visual countdown
  const playCountdownSound = useCallback((count: number) => {
    playCountdown(count);
  }, [playCountdown]);

  // Expose start sound
  const playStartSound = useCallback(() => {
    playStart();
  }, [playStart]);

  // Combo milestone thresholds
  const COMBO_MILESTONES = [5, 10, 15, 20, 25, 30, 50];

  // Handle directional input
  const handleInput = useCallback((direction: Direction) => {
    if (context.state !== 'playing') return;
    
    const inputTime = context.startTime 
      ? Date.now() - context.startTime 
      : 0;
    
    // Dispatch the input for animation
    dispatch({ type: 'INPUT', direction });
    
    // Evaluate the input
    const result = evaluateInput(context, direction, inputTime);
    const prevCombo = context.score.combo;
    
    switch (result) {
      case 'perfect': {
        dispatch({ type: 'PERFECT_HIT' });
        playPerfect();
        const newCombo = prevCombo + 1;
        if (COMBO_MILESTONES.includes(newCombo)) {
          playCombo();
          logger.dev(`[useDanceGame] 🔥 COMBO x${newCombo}!`);
        }
        logger.dev('[useDanceGame] PERFECT!');
        break;
      }
      case 'good': {
        dispatch({ type: 'GOOD_HIT' });
        playGood();
        const newCombo = prevCombo + 1;
        if (COMBO_MILESTONES.includes(newCombo)) {
          playCombo();
          logger.dev(`[useDanceGame] 🔥 COMBO x${newCombo}!`);
        }
        logger.dev('[useDanceGame] Good!');
        break;
      }
      case 'miss':
        dispatch({ type: 'MISS' });
        playMiss();
        playStumble();
        logger.dev('[useDanceGame] Miss...');
        break;
      case 'early':
        // Too early, ignore
        break;
    }
  }, [context, dispatch, playPerfect, playGood, playMiss, playStumble, playCombo]);

  // Pause game
  const pause = useCallback(() => {
    dispatch({ type: 'PAUSE' });
    audioRef.current?.pause();
  }, [dispatch]);

  // Resume game
  const resume = useCallback(() => {
    dispatch({ type: 'RESUME' });
    audioRef.current?.play();
  }, [dispatch]);

  // Reset game
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    
  }, [dispatch]);

  // Get current lyric based on elapsed time
  const getCurrentLyric = useCallback(() => {
    if (!context.currentSong || !context.startTime) return '';
    
    const elapsed = Date.now() - context.startTime;
    const lyrics = context.currentSong.lyrics;
    
    // Find the most recent lyric
    let currentLyric = '';
    for (const lyric of lyrics) {
      if (lyric.time <= elapsed) {
        currentLyric = lyric.text;
      } else {
        break;
      }
    }
    
    return currentLyric;
  }, [context.currentSong, context.startTime]);

  // Get next move
  const getNextMove = useCallback(() => {
    if (!context.currentSong) return null;
    
    const moves = context.currentSong.pattern.moves;
    const currentMove = moves[context.currentMoveIndex];
    
    return currentMove || null;
  }, [context.currentSong, context.currentMoveIndex]);

  // Get time until next move
  const getTimeToNextMove = useCallback(() => {
    const nextMove = getNextMove();
    if (!nextMove || !context.startTime) return Infinity;
    
    const elapsed = Date.now() - context.startTime;
    return nextMove.time - elapsed;
  }, [getNextMove, context.startTime]);

  // Game loop - check for missed notes and song end
  useEffect(() => {
    if (context.state !== 'playing') return;

    const gameLoop = () => {
      // Check for missed notes
      if (checkMissedNotes(context)) {
        dispatch({ type: 'MISS' });
      }
      
      // Check for song end
      if (context.currentSong && context.startTime) {
        const elapsed = Date.now() - context.startTime;
        if (elapsed >= context.currentSong.duration * 1000) {
          dispatch({ type: 'SONG_END' });
          // Play celebration sound for completing the song
          playCelebrate();
          return;
        }
      }
      
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [context.state, context, dispatch, playCelebrate]);

  // Stumble recovery timer
  useEffect(() => {
    if (context.state === 'stumbled') {
      const timer = setTimeout(() => {
        dispatch({ type: 'STUMBLE_RECOVERY' });
      }, 800); // Recover after 800ms
      
      return () => clearTimeout(timer);
    }
  }, [context.state, dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, []);

  return {
    context,
    selectSong,
    startGame,
    handleInput,
    pause,
    resume,
    reset,
    getCurrentLyric,
    getNextMove,
    getTimeToNextMove,
    playCountdownSound,
    playStartSound,
  };
}
