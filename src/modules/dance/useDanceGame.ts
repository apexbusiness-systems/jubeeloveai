/**
 * JubeeDance Game Hook
 * 
 * React hook for managing the dance game state using the FSM.
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
}

export function useDanceGame(): UseDanceGameReturn {
  const [context, setContext] = useState<DanceGameContext>(createInitialContext);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const gameLoopRef = useRef<number | null>(null);
  const countdownRef = useRef<number>(3);
  const countdownIntervalRef = useRef<number | null>(null);

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
    
    logger.info('[useDanceGame] Song selected:', song.title);
  }, [dispatch]);

  // Start countdown and then game
  const startGame = useCallback(() => {
    if (!context.currentSong) {
      logger.warn('[useDanceGame] Cannot start without a song selected');
      return;
    }

    dispatch({ type: 'START_COUNTDOWN' });
    countdownRef.current = 3;

    // Countdown interval
    countdownIntervalRef.current = window.setInterval(() => {
      countdownRef.current -= 1;
      
      if (countdownRef.current <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        
        dispatch({ type: 'COUNTDOWN_COMPLETE' });
        
        // Start audio
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch((err) => {
            logger.error('[useDanceGame] Audio play failed:', err);
          });
        }
      }
    }, 1000);
  }, [context.currentSong, dispatch]);

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
    
    switch (result) {
      case 'perfect':
        dispatch({ type: 'PERFECT_HIT' });
        logger.dev('[useDanceGame] PERFECT!');
        break;
      case 'good':
        dispatch({ type: 'GOOD_HIT' });
        logger.dev('[useDanceGame] Good!');
        break;
      case 'miss':
        dispatch({ type: 'MISS' });
        logger.dev('[useDanceGame] Miss...');
        break;
      case 'early':
        // Too early, ignore
        break;
    }
  }, [context, dispatch]);

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
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
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
  }, [context.state, context, dispatch]);

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
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
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
  };
}
