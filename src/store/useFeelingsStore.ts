/**
 * Feelings Explorer store — persists scene history, journal stickers,
 * and the child's self-report log. Idempotent: collecting the same sticker
 * twice is a no-op; replaying a scene doesn't double-count it.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { EmotionKey } from '@/modules/feelings/scenes';

interface FeelingsState {
  playedSceneIds: string[];
  journal: EmotionKey[];          // unique set, insertion-ordered
  selfReports: { at: number; emotion: EmotionKey }[];
  totalCorrect: number;
  totalPlayed: number;
  recordScenePlayed: (sceneId: string, emotion: EmotionKey, correct: boolean) => void;
  recordSelfReport: (emotion: EmotionKey) => void;
  reset: () => void;
}

export const useFeelingsStore = create<FeelingsState>()(
  persist(
    immer((set) => ({
      playedSceneIds: [],
      journal: [],
      selfReports: [],
      totalCorrect: 0,
      totalPlayed: 0,

      recordScenePlayed: (sceneId, emotion, correct) => {
        set(draft => {
          if (!draft.playedSceneIds.includes(sceneId)) {
            draft.playedSceneIds.push(sceneId);
          }
          if (correct && !draft.journal.includes(emotion)) {
            draft.journal.push(emotion);
          }
          draft.totalPlayed += 1;
          if (correct) draft.totalCorrect += 1;
          // Soft caps — protect against runaway storage
          if (draft.selfReports.length > 500) {
            draft.selfReports = draft.selfReports.slice(-500);
          }
        });
      },

      recordSelfReport: (emotion) => {
        set(draft => {
          draft.selfReports.push({ at: Date.now(), emotion });
          if (draft.selfReports.length > 500) {
            draft.selfReports = draft.selfReports.slice(-500);
          }
        });
      },

      reset: () => set(draft => {
        draft.playedSceneIds = [];
        draft.journal = [];
        draft.selfReports = [];
        draft.totalCorrect = 0;
        draft.totalPlayed = 0;
      }),
    })),
    { name: 'jubee-feelings-storage', version: 1 },
  ),
);
