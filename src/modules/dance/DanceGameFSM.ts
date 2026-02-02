/**
 * JubeeDance Finite State Machine
 * 
 * Proprietary FSM engine for managing dance game state transitions.
 * Designed for deterministic, flawless state management.
 */

import type { 
  DanceGameContext, 
  DanceGameEvent, 
  GameState,
  DanceAnimation,
  GameScore 
} from './types';
import { logger } from '@/lib/logger';

// Initial state factory
export function createInitialContext(): DanceGameContext {
  return {
    state: 'idle',
    currentSong: null,
    currentMoveIndex: 0,
    score: {
      perfect: 0,
      good: 0,
      missed: 0,
      combo: 0,
      maxCombo: 0,
      totalScore: 0,
    },
    animation: 'idle',
    startTime: null,
    elapsedTime: 0,
  };
}

// Score calculation constants
const SCORE_PERFECT = 100;
const SCORE_GOOD = 50;
const COMBO_MULTIPLIER = 10;

// Calculate new score based on hit type
function calculateScore(currentScore: GameScore, hitType: 'perfect' | 'good' | 'miss'): GameScore {
  if (hitType === 'miss') {
    return {
      ...currentScore,
      missed: currentScore.missed + 1,
      combo: 0, // Reset combo on miss
    };
  }
  
  const baseScore = hitType === 'perfect' ? SCORE_PERFECT : SCORE_GOOD;
  const comboBonus = currentScore.combo * COMBO_MULTIPLIER;
  const newCombo = currentScore.combo + 1;
  
  return {
    perfect: hitType === 'perfect' ? currentScore.perfect + 1 : currentScore.perfect,
    good: hitType === 'good' ? currentScore.good + 1 : currentScore.good,
    missed: currentScore.missed,
    combo: newCombo,
    maxCombo: Math.max(currentScore.maxCombo, newCombo),
    totalScore: currentScore.totalScore + baseScore + comboBonus,
  };
}

// Get animation for direction
function getDirectionAnimation(direction: 'up' | 'down' | 'left' | 'right'): DanceAnimation {
  const animationMap: Record<string, DanceAnimation> = {
    up: 'dance-up',
    down: 'dance-down',
    left: 'dance-left',
    right: 'dance-right',
  };
  return animationMap[direction] || 'idle';
}

// State transition handlers
const stateHandlers: Record<GameState, (ctx: DanceGameContext, event: DanceGameEvent) => DanceGameContext> = {
  idle: (ctx, event) => {
    if (event.type === 'SELECT_SONG') {
      logger.info('[DanceGameFSM] Song selected:', event.song.title);
      return {
        ...ctx,
        currentSong: event.song,
        state: 'idle',
        animation: 'wave',
      };
    }
    if (event.type === 'START_COUNTDOWN' && ctx.currentSong) {
      logger.info('[DanceGameFSM] Starting countdown');
      return {
        ...ctx,
        state: 'countdown',
        animation: 'idle',
      };
    }
    return ctx;
  },

  countdown: (ctx, event) => {
    if (event.type === 'COUNTDOWN_COMPLETE') {
      logger.info('[DanceGameFSM] Countdown complete, starting game');
      return {
        ...ctx,
        state: 'playing',
        startTime: Date.now(),
        elapsedTime: 0,
        animation: 'idle',
      };
    }
    if (event.type === 'RESET') {
      return createInitialContext();
    }
    return ctx;
  },

  playing: (ctx, event) => {
    switch (event.type) {
      case 'INPUT': {
        const { direction } = event;
        logger.dev('[DanceGameFSM] Input received:', direction);
        return {
          ...ctx,
          animation: getDirectionAnimation(direction),
        };
      }
      
      case 'PERFECT_HIT': {
        const newScore = calculateScore(ctx.score, 'perfect');
        return {
          ...ctx,
          score: newScore,
          currentMoveIndex: ctx.currentMoveIndex + 1,
        };
      }
      
      case 'GOOD_HIT': {
        const newScore = calculateScore(ctx.score, 'good');
        return {
          ...ctx,
          score: newScore,
          currentMoveIndex: ctx.currentMoveIndex + 1,
        };
      }
      
      case 'MISS': {
        const newScore = calculateScore(ctx.score, 'miss');
        logger.info('[DanceGameFSM] Miss! Transitioning to stumble');
        return {
          ...ctx,
          score: newScore,
          state: 'stumbled',
          animation: 'stumble',
          currentMoveIndex: ctx.currentMoveIndex + 1,
        };
      }
      
      case 'PAUSE':
        return { ...ctx, state: 'paused' };
      
      case 'SONG_END': {
        const hasPerfectRun = ctx.score.missed === 0;
        return {
          ...ctx,
          state: hasPerfectRun ? 'celebrating' : 'finished',
          animation: hasPerfectRun ? 'celebrate' : 'wave',
        };
      }
      
      case 'RESET':
        return createInitialContext();
      
      default:
        return ctx;
    }
  },

  paused: (ctx, event) => {
    if (event.type === 'RESUME') {
      return { ...ctx, state: 'playing' };
    }
    if (event.type === 'RESET') {
      return createInitialContext();
    }
    return ctx;
  },

  stumbled: (ctx, event) => {
    if (event.type === 'STUMBLE_RECOVERY') {
      logger.info('[DanceGameFSM] Recovering from stumble');
      return {
        ...ctx,
        state: 'playing',
        animation: 'idle',
      };
    }
    if (event.type === 'SONG_END') {
      return { ...ctx, state: 'finished', animation: 'wave' };
    }
    if (event.type === 'RESET') {
      return createInitialContext();
    }
    return ctx;
  },

  celebrating: (ctx, event) => {
    if (event.type === 'RESET') {
      return createInitialContext();
    }
    return ctx;
  },

  finished: (ctx, event) => {
    if (event.type === 'RESET') {
      return createInitialContext();
    }
    if (event.type === 'SELECT_SONG') {
      return {
        ...createInitialContext(),
        currentSong: event.song,
        animation: 'wave',
      };
    }
    return ctx;
  },
};

/**
 * Main FSM transition function
 * Deterministic state transition based on current state and event
 */
export function transition(
  context: DanceGameContext,
  event: DanceGameEvent
): DanceGameContext {
  const handler = stateHandlers[context.state];
  
  if (!handler) {
    logger.error('[DanceGameFSM] No handler for state:', context.state);
    return context;
  }
  
  const newContext = handler(context, event);
  
  // Log state transitions in dev mode
  if (newContext.state !== context.state) {
    logger.dev('[DanceGameFSM] State transition:', {
      from: context.state,
      to: newContext.state,
      event: event.type,
    });
  }
  
  return newContext;
}

/**
 * Check if a move input is valid for the current time
 */
export function evaluateInput(
  context: DanceGameContext,
  direction: 'up' | 'down' | 'left' | 'right',
  inputTime: number
): 'perfect' | 'good' | 'miss' | 'early' {
  if (!context.currentSong || !context.startTime) {
    return 'miss';
  }
  
  const pattern = context.currentSong.pattern;
  const currentMove = pattern.moves[context.currentMoveIndex];
  
  if (!currentMove) {
    return 'miss'; // No more moves
  }
  
  const expectedTime = currentMove.time;
  const timeDiff = Math.abs(inputTime - expectedTime);
  
  // Wrong direction is always a miss
  if (currentMove.direction !== direction) {
    return 'miss';
  }
  
  // Timing thresholds (in ms)
  const PERFECT_WINDOW = 100;
  const GOOD_WINDOW = 200;
  const EARLY_WINDOW = 400;
  
  if (inputTime < expectedTime - EARLY_WINDOW) {
    return 'early'; // Too early, don't count yet
  }
  
  if (timeDiff <= PERFECT_WINDOW) {
    return 'perfect';
  }
  
  if (timeDiff <= GOOD_WINDOW) {
    return 'good';
  }
  
  return 'miss';
}

/**
 * Check for missed notes based on elapsed time
 */
export function checkMissedNotes(context: DanceGameContext): boolean {
  if (!context.currentSong || !context.startTime) {
    return false;
  }
  
  const pattern = context.currentSong.pattern;
  const currentMove = pattern.moves[context.currentMoveIndex];
  
  if (!currentMove) {
    return false;
  }
  
  const elapsedTime = Date.now() - context.startTime;
  const MISS_THRESHOLD = 300; // 300ms after the note time = miss
  
  return elapsedTime > currentMove.time + MISS_THRESHOLD;
}
