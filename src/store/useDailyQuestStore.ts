/**
 * Daily Quest Store — persists today's 3-step adaptive learning quest
 * and tracks step completion. Idempotent: same (childId, day) re-uses
 * the existing quest; a new day auto-rolls a fresh one.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { pickDailyQuest, getDayKey, type QuestActivity } from '@/lib/dailyQuest/questPicker';
import type { MasteryRecord } from './useMasteryStore';

interface PersistedQuest {
  dayKey: string;
  childId: string;
  steps: QuestActivity[];
  completed: string[]; // paths
  generatedAt: number;
  celebratedAt?: number;
}

interface DailyQuestState {
  current: PersistedQuest | null;
  ensureQuest: (input: {
    childId: string;
    masteryRecords?: MasteryRecord[];
    favoritePaths?: string[];
    now?: Date;
  }) => PersistedQuest;
  markStepComplete: (path: string) => void;
  markCelebrated: () => void;
  isComplete: () => boolean;
  reset: () => void;
}

export const useDailyQuestStore = create<DailyQuestState>()(
  persist(
    immer((set, get) => ({
      current: null,

      ensureQuest: ({ childId, masteryRecords, favoritePaths, now }) => {
        const dayKey = getDayKey(now);
        const existing = get().current;
        if (existing && existing.dayKey === dayKey && existing.childId === childId) {
          return existing;
        }
        const steps = pickDailyQuest({ childId, masteryRecords, favoritePaths, now });
        const fresh: PersistedQuest = {
          dayKey,
          childId,
          steps,
          completed: [],
          generatedAt: Date.now(),
        };
        set(draft => { draft.current = fresh; });
        return fresh;
      },

      markStepComplete: (path) => {
        set(draft => {
          if (!draft.current) return;
          if (!draft.current.steps.some(s => s.path === path)) return;
          if (draft.current.completed.includes(path)) return;
          draft.current.completed.push(path);
        });
      },

      markCelebrated: () => {
        set(draft => {
          if (draft.current) draft.current.celebratedAt = Date.now();
        });
      },

      isComplete: () => {
        const c = get().current;
        return !!c && c.completed.length >= c.steps.length;
      },

      reset: () => set(draft => { draft.current = null; }),
    })),
    { name: 'jubee-daily-quest-storage', version: 1 },
  ),
);
