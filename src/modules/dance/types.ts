/**
 * JubeeDance Type Definitions
 * 
 * Premium 3D rhythm game type system for the dance game.
 */

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface DanceMove {
  direction: Direction;
  time: number; // milliseconds from song start
  duration?: number; // optional hold duration
}

export interface DancePattern {
  moves: DanceMove[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface DanceSong {
  id: string;
  title: string;
  artist: string;
  emoji: string;
  duration: number; // seconds
  bpm: number;
  audioUrl: string;
  lyrics: { time: number; text: string }[];
  pattern: DancePattern;
  tier: 'free' | 'premium';
  ageRange: '2-3' | '3-4' | '4-5' | 'all';
}

export type GameState = 
  | 'idle'           // Waiting for player
  | 'countdown'      // 3-2-1 countdown
  | 'playing'        // Active gameplay
  | 'paused'         // Game paused
  | 'celebrating'    // Perfect finish celebration
  | 'stumbled'       // Player made mistake
  | 'finished';      // Song completed

export type DanceAnimation = 
  | 'idle'
  | 'dance-up'
  | 'dance-down'
  | 'dance-left'
  | 'dance-right'
  | 'spin'
  | 'jump'
  | 'stumble'
  | 'celebrate'
  | 'wave';

export interface GameScore {
  perfect: number;
  good: number;
  missed: number;
  combo: number;
  maxCombo: number;
  totalScore: number;
}

export interface DanceGameContext {
  state: GameState;
  currentSong: DanceSong | null;
  currentMoveIndex: number;
  score: GameScore;
  animation: DanceAnimation;
  startTime: number | null;
  elapsedTime: number;
}

export type DanceGameEvent =
  | { type: 'SELECT_SONG'; song: DanceSong }
  | { type: 'START_COUNTDOWN' }
  | { type: 'COUNTDOWN_COMPLETE' }
  | { type: 'INPUT'; direction: Direction }
  | { type: 'PERFECT_HIT' }
  | { type: 'GOOD_HIT' }
  | { type: 'MISS' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'SONG_END' }
  | { type: 'RESET' }
  | { type: 'STUMBLE_RECOVERY' };

// FSM transition function type
export type DanceGameTransition = (
  context: DanceGameContext,
  event: DanceGameEvent
) => DanceGameContext;
