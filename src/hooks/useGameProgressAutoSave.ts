import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { jubeeDB } from '@/lib/indexedDB';
import { logger } from '@/lib/logger';

const DEBOUNCE_MS = 2000; // 2 seconds debounce

/**
 * Hook that auto-saves game progress to IndexedDB whenever state changes.
 * Uses debouncing to prevent excessive writes.
 */
export function useGameProgressAutoSave() {
  const { score, currentTheme, completedActivities, stickers } = useGameStore();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  const saveProgress = useCallback(async () => {
    const progressData = {
      id: 'current-progress',
      score,
      activitiesCompleted: completedActivities.length,
      currentTheme,
      lastActivity: completedActivities[completedActivities.length - 1] || undefined,
      updatedAt: new Date().toISOString(),
      synced: false,
    };

    // Create a hash to check if data actually changed
    const dataHash = JSON.stringify({ score, currentTheme, completedActivities: completedActivities.length });
    
    if (dataHash === lastSavedRef.current) {
      return; // No changes, skip save
    }

    try {
      await jubeeDB.put('gameProgress', progressData);
      lastSavedRef.current = dataHash;
      logger.dev('[AutoSave] Game progress saved to IndexedDB');
    } catch (error) {
      logger.error('[AutoSave] Failed to save game progress:', error);
    }

    // Also save stickers if any
    for (const stickerId of stickers) {
      try {
        await jubeeDB.put('stickers', {
          id: `sticker-${stickerId}`,
          stickerId,
          unlockedAt: new Date().toISOString(),
          synced: false,
        });
      } catch (error) {
        logger.error('[AutoSave] Failed to save sticker:', error);
      }
    }
  }, [score, currentTheme, completedActivities, stickers]);

  // Debounced save on state changes
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveProgress();
    }, DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [saveProgress]);

  // Immediate save on unmount
  useEffect(() => {
    return () => {
      saveProgress();
    };
  }, [saveProgress]);

  // Manual save function for immediate persistence
  const forceSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    return saveProgress();
  }, [saveProgress]);

  return { forceSave };
}
