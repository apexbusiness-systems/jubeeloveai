/**
 * JubeeDance Game Hook
 * 
 * React hook for managing the dance game state using the FSM.
 * Includes sound effects integration for enhanced gameplay feedback.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { DanceGameContext, DanceSong, Direction, DanceGameEvent } from './types';
import { 
  createInitialContext, 
  transition, 
  evaluateInput, 
  checkMissedNotes 
} from './DanceGameFSM';
import { logger } from '@/lib/logger';
import { useDanceSoundEffects } from '@/hooks/useDanceSoundEffects';
import { DanceClock } from './engine/DanceClock';

const COMBO_MILESTONES = [5, 10, 15, 20, 25, 30, 50];

interface UseDanceGameReturn {
  context: DanceGameContext;
  countdownValue: number | null;
  songTimeMs: number;
  selectSong: (song: DanceSong) => void;
  startGame: () => void;
  handleInput: (direction: Direction) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  getCurrentLyric: () => string;
  getNextMove: () => { direction: Direction; time: number } | null;
  getTimeToNextMove: () => number;
  getSongTimeMs: () => number;
}

export function useDanceGame(): UseDanceGameReturn {
  const [context, setContext] = useState<DanceGameContext>(createInitialContext);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [songTimeMs, setSongTimeMs] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const gameLoopRef = useRef<number | null>(null);
  const clockRef = useRef<DanceClock | null>(null);
  const prefersReducedMotion = useReducedMotion();
  
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
    audioRef.current.setAttribute('playsinline', 'true');
    audioRef.current.setAttribute('webkit-playsinline', 'true');
    clockRef.current?.dispose();
    clockRef.current = new DanceClock(audioRef.current);
    setSongTimeMs(0);
    
    // Preload sound effects in background
    preloadSounds();
    
    logger.info('[useDanceGame] Song selected:', song.title);
  }, [dispatch, preloadSounds]);

  // Start game countdown (single source of truth)
  const startGame = useCallback(() => {
    if (!context.currentSong) {
      logger.warn('[useDanceGame] Cannot start without a song selected');
      return;
    }
    if (context.state === 'playing' || context.state === 'countdown') return;

    // Transition FSM to countdown state
    dispatch({ type: 'START_COUNTDOWN' });
    setCountdownValue(3);
  }, [context.currentSong, context.state, dispatch]);

  // Countdown effect (visual + audio)
  useEffect(() => {
    if (countdownValue === null) return;

    if (countdownValue > 0) {
      playCountdown(countdownValue);
      const timer = setTimeout(() => {
        setCountdownValue((prev) => (prev === null ? null : prev - 1));
      }, 1000);
      return () => clearTimeout(timer);
    }

    setCountdownValue(null);
    dispatch({ type: 'COUNTDOWN_COMPLETE' });
    playStart();

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        logger.error('[useDanceGame] Audio play failed:', err);
      });
    }

    logger.info('[useDanceGame] Game started!');
  }, [countdownValue, dispatch, playCountdown, playStart]);

  // Handle directional input
  const handleInput = useCallback((direction: Direction) => {
    if (context.state !== 'playing') return;
    
    const inputTime = clockRef.current?.getSongTimeMs() ?? 0;
    
    // Dispatch the input for animation
    dispatch({ type: 'INPUT', direction });
    
    // Evaluate the input
    const result = evaluateInput(context, direction, inputTime);
    const prevCombo = context.score.combo;
    
    switch (result) {
      case 'perfect': {
        dispatch({ type: 'PERFECT_HIT' });
        playPerfect();
        if (!prefersReducedMotion && typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([10]);
        }
        const newCombo = prevCombo + 1;
        if (COMBO_MILESTONES.includes(newCombo)) {
          playCombo();
          logger.dev(`[useDanceGame] COMBO x${newCombo}!`);
        }
        logger.dev('[useDanceGame] PERFECT!');
        break;
      }
      case 'good': {
        dispatch({ type: 'GOOD_HIT' });
        playGood();
        if (!prefersReducedMotion && typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([6]);
        }
        const newCombo = prevCombo + 1;
        if (COMBO_MILESTONES.includes(newCombo)) {
          playCombo();
          logger.dev(`[useDanceGame] COMBO x${newCombo}!`);
        }
        logger.dev('[useDanceGame] Good!');
        break;
      }
      case 'miss':
        dispatch({ type: 'MISS' });
        playMiss();
        playStumble();
        if (!prefersReducedMotion && typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([18]);
        }
        logger.dev('[useDanceGame] Miss...');
        break;
      case 'early':
        // Too early, ignore
        break;
    }
  }, [context, dispatch, playPerfect, playGood, playMiss, playStumble, playCombo, prefersReducedMotion]);

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
    setCountdownValue(null);
    setSongTimeMs(0);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    clockRef.current?.dispose();
    clockRef.current = null;
    
  }, [dispatch]);

  // Get current lyric based on elapsed time
  const getCurrentLyric = useCallback(() => {
    if (!context.currentSong) return '';

    const elapsed = songTimeMs;
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
  }, [context.currentSong, songTimeMs]);

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
    if (!nextMove) return Infinity;
    
    const elapsed = songTimeMs;
    return nextMove.time - elapsed;
  }, [getNextMove, songTimeMs]);

  // Game loop - check for missed notes and song end
  useEffect(() => {
    if (context.state !== 'playing') return;

    const gameLoop = () => {
      const currentSongTime = clockRef.current?.getSongTimeMs() ?? 0;
      // Check for missed notes
      if (checkMissedNotes(context, currentSongTime)) {
        dispatch({ type: 'MISS' });
      }
      
      // Check for song end
      if (context.currentSong) {
        if (currentSongTime >= context.currentSong.duration * 1000) {
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
      clockRef.current?.dispose();
    };
  }, []);

  // Keep UI song time in sync (low frequency via audio timeupdate)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleTimeUpdate = () => {
      setSongTimeMs(clockRef.current?.getSongTimeMs() ?? 0);
    };
    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [context.currentSong]);

  const getSongTimeMs = useCallback(() => {
    return clockRef.current?.getSongTimeMs() ?? songTimeMs;
  }, [songTimeMs]);

  return {
    context,
    countdownValue,
    songTimeMs,
    selectSong,
    startGame,
    handleInput,
    pause,
    resume,
    reset,
    getCurrentLyric,
    getNextMove,
    getTimeToNextMove,
    getSongTimeMs,
  };
}
