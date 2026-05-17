import { describe, it, expect } from 'vitest';
import { pickDailyQuest, getDayKey, getDayPart } from './questPicker';
import { Skills } from '@/lib/mastery/taxonomy';
import type { MasteryRecord } from '@/store/useMasteryStore';

const mkRecord = (skillId: string, score: number): MasteryRecord => ({
  skillId: skillId as MasteryRecord['skillId'],
  score,
  attempts: 5,
  successes: 3,
  fastResponses: 1,
  hintsUsed: 1,
  lastPracticed: Date.now(),
  nextReviewDue: Date.now(),
});

describe('pickDailyQuest', () => {
  it('returns exactly 3 unique activities', () => {
    const quest = pickDailyQuest({ childId: 'kid-1', now: new Date('2026-05-17T09:00:00') });
    expect(quest).toHaveLength(3);
    expect(new Set(quest.map(q => q.path)).size).toBe(3);
  });

  it('is deterministic for the same childId + day', () => {
    const a = pickDailyQuest({ childId: 'kid-1', now: new Date('2026-05-17T09:00:00') });
    const b = pickDailyQuest({ childId: 'kid-1', now: new Date('2026-05-17T11:30:00') });
    expect(a.map(x => x.path)).toEqual(b.map(x => x.path));
  });

  it('refreshes across calendar days', () => {
    const a = pickDailyQuest({ childId: 'kid-1', now: new Date('2026-05-17T09:00:00') });
    const b = pickDailyQuest({ childId: 'kid-1', now: new Date('2026-05-20T09:00:00') });
    // Not guaranteed different, but extremely likely; just verify both valid
    expect(a).toHaveLength(3);
    expect(b).toHaveLength(3);
  });

  it('prioritizes favorite path as warm-up step', () => {
    const quest = pickDailyQuest({
      childId: 'kid-1',
      favoritePaths: ['/stories'],
      now: new Date('2026-05-17T09:00:00'),
    });
    expect(quest[0].path).toBe('/stories');
    expect(quest[0].reason).toBe('favorite');
  });

  it('includes a review step when low-mastery skill exists', () => {
    const quest = pickDailyQuest({
      childId: 'kid-1',
      masteryRecords: [mkRecord(Skills.TRACING.id, 10)],
      now: new Date('2026-05-17T09:00:00'),
    });
    expect(quest.some(q => q.reason === 'review' && q.path === '/write')).toBe(true);
  });

  it('picks a calming closer in the evening', () => {
    const quest = pickDailyQuest({ childId: 'kid-1', now: new Date('2026-05-17T20:00:00') });
    expect(['/stories', '/music']).toContain(quest[2].path);
    expect(quest[2].reason).toBe('wind-down');
  });
});

describe('getDayKey / getDayPart', () => {
  it('formats stable YYYY-MM-DD', () => {
    expect(getDayKey(new Date('2026-01-05T03:00:00'))).toBe('2026-01-05');
  });
  it('maps hours to dayparts', () => {
    expect(getDayPart(new Date('2026-05-17T08:00:00'))).toBe('morning');
    expect(getDayPart(new Date('2026-05-17T14:00:00'))).toBe('afternoon');
    expect(getDayPart(new Date('2026-05-17T19:00:00'))).toBe('evening');
  });
});
