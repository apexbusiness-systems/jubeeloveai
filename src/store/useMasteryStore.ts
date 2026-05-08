import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { SkillId } from '@/lib/mastery/taxonomy';

export interface MasteryRecord {
  skillId: SkillId;
  score: number;
  attempts: number;
  successes: number;
  fastResponses: number;
  hintsUsed: number;
  lastPracticed: number;
  nextReviewDue: number;
}

interface MasteryState {
  records: Record<string, Record<SkillId, MasteryRecord>>;
  recordAttempt: (childId: string, skillId: SkillId, isSuccess: boolean, useHint: boolean, responseTimeMs: number) => void;
  getStrongestSkills: (childId: string, limit?: number) => MasteryRecord[];
  getNeedsReviewSkills: (childId: string, limit?: number) => MasteryRecord[];
  getPracticedToday: (childId: string) => MasteryRecord[];
  clearMastery: (childId: string) => void;
}

const DEFAULT_RECORD = (skillId: SkillId): MasteryRecord => ({
  skillId,
  score: 0,
  attempts: 0,
  successes: 0,
  fastResponses: 0,
  hintsUsed: 0,
  lastPracticed: 0,
  nextReviewDue: Date.now(),
});

const calculateNextReview = (score: number, lastPracticed: number) => {
  let hoursToAdd = 24;
  if (score > 90) hoursToAdd = 24 * 7;
  else if (score > 70) hoursToAdd = 24 * 3;
  else if (score < 40) hoursToAdd = 12;
  return lastPracticed + (hoursToAdd * 60 * 60 * 1000);
};

export const useMasteryStore = create<MasteryState>()(
  persist(
    immer((set, get) => ({
      records: {},
      recordAttempt: (childId, skillId, isSuccess, useHint, responseTimeMs) => {
        set(state => {
          if (!state.records[childId]) state.records[childId] = {} as Record<SkillId, MasteryRecord>;
          let record = state.records[childId][skillId];
          if (!record) {
            record = DEFAULT_RECORD(skillId);
            state.records[childId][skillId] = record;
          }
          record.attempts += 1;
          if (isSuccess) record.successes += 1;
          if (useHint) record.hintsUsed += 1;
          if (isSuccess && responseTimeMs < 3000) record.fastResponses += 1;
          const successRate = record.successes / record.attempts;
          const speedFactor = record.fastResponses / record.successes || 0;
          const hintPenalty = record.hintsUsed / record.attempts;
          record.score = Math.max(0, Math.min(100, Math.round((successRate * 80) + (speedFactor * 30) - (hintPenalty * 20))));
          record.lastPracticed = Date.now();
          record.nextReviewDue = calculateNextReview(record.score, record.lastPracticed);
        });
      },
      getStrongestSkills: (childId, limit = 3) => {
        const records = get().records[childId];
        if (!records) return [];
        return Object.values(records).filter(r => r.attempts > 2).sort((a, b) => b.score - a.score).slice(0, limit);
      },
      getNeedsReviewSkills: (childId, limit = 3) => {
        const records = get().records[childId];
        if (!records) return [];
        const now = Date.now();
        return Object.values(records).filter(r => r.nextReviewDue <= now || r.score < 50).sort((a, b) => a.score - b.score).slice(0, limit);
      },
      getPracticedToday: (childId) => {
        const records = get().records[childId];
        if (!records) return [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return Object.values(records).filter(r => r.lastPracticed >= today.getTime());
      },
      clearMastery: (childId) => {
        set(state => { delete state.records[childId]; });
      }
    })),
    { name: 'jubee-mastery-storage', version: 1 }
  )
);
