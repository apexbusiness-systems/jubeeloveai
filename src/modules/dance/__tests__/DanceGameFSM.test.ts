import { describe, it, expect } from 'vitest';
import { createInitialContext, evaluateInput, checkMissedNotes, transition } from '../DanceGameFSM';
import type { DanceGameContext, DanceSong } from '../types';

const baseSong: DanceSong = {
  id: 'test-song',
  title: 'Test Song',
  artist: 'Test Artist',
  emoji: '',
  duration: 120,
  bpm: 120,
  audioUrl: 'about:blank',
  lyrics: [],
  pattern: {
    difficulty: 'easy',
    moves: [{ direction: 'up', time: 1000 }],
  },
  tier: 'free',
  ageRange: 'all',
};

const buildContext = (overrides: Partial<DanceGameContext> = {}): DanceGameContext => ({
  ...createInitialContext(),
  currentSong: baseSong,
  state: 'playing',
  ...overrides,
});

describe('DanceGameFSM timing', () => {
  it('evaluates perfect/good/miss timing windows', () => {
    const context = buildContext();

    expect(evaluateInput(context, 'up', 1000)).toBe('perfect');
    expect(evaluateInput(context, 'up', 1099)).toBe('perfect');
    expect(evaluateInput(context, 'up', 1150)).toBe('good');
    expect(evaluateInput(context, 'up', 1300)).toBe('miss');
    expect(evaluateInput(context, 'left', 1000)).toBe('miss');
  });

  it('ignores early input before the early window', () => {
    const context = buildContext();

    expect(evaluateInput(context, 'up', 500)).toBe('early');
  });

  it('does not drift across pause/resume for judgments', () => {
    const context = buildContext();
    const paused = transition(context, { type: 'PAUSE' });
    const resumed = transition(paused, { type: 'RESUME' });

    expect(evaluateInput(context, 'up', 1000)).toBe('perfect');
    expect(evaluateInput(resumed, 'up', 1000)).toBe('perfect');
  });

  it('keeps missed-note detection stable when song time is held', () => {
    const context = buildContext();
    const paused = transition(context, { type: 'PAUSE' });

    expect(checkMissedNotes(context, 900)).toBe(false);
    expect(checkMissedNotes(paused, 900)).toBe(false);
    expect(checkMissedNotes(context, 1400)).toBe(true);
  });
});
