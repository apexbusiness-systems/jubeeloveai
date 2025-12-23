import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { jubeeDB } from '@/lib/indexedDB';
import { logger } from '@/lib/logger';

/**
 * Hook to restore game progress from IndexedDB on app initialization
 * Should be called once at app startup
 */
export function useGameProgressRestore() {
  const [isRestoring, setIsRestoring] = useState(true);
  const [isRestored, setIsRestored] = useState(false);

  useEffect(() => {
    const restoreProgress = async () => {
      try {
        // Get all saved game progress entries
        const allProgress = await jubeeDB.getAll('gameProgress');
        
        if (allProgress.length > 0) {
          // Get the most recent entry (by updatedAt)
          const latestProgress = allProgress.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )[0];

          // Restore score if valid
          if (typeof latestProgress.score === 'number' && latestProgress.score >= 0) {
            const currentScore = useGameStore.getState().score;
            if (latestProgress.score > currentScore) {
              useGameStore.setState({ score: latestProgress.score });
              logger.dev('[Restore] Score restored:', latestProgress.score);
            }
          }

          // Restore theme if valid
          if (latestProgress.currentTheme) {
            const validThemes = ['morning', 'afternoon', 'evening'];
            if (validThemes.includes(latestProgress.currentTheme)) {
              useGameStore.setState({ currentTheme: latestProgress.currentTheme as 'morning' | 'afternoon' | 'evening' });
              logger.dev('[Restore] Theme restored:', latestProgress.currentTheme);
            }
          }

          // Restore activities completed count (lastActivity serves as indicator)
          if (latestProgress.lastActivity) {
            logger.dev('[Restore] Last activity:', latestProgress.lastActivity);
          }

          logger.dev('[Restore] Game progress restored from IndexedDB');
        }

        // Also restore stickers
        const allStickers = await jubeeDB.getAll('stickers');
        if (allStickers.length > 0) {
          const stickerIds = allStickers.map(s => s.stickerId);
          const currentStickers = useGameStore.getState().stickers;
          const merged = [...new Set([...currentStickers, ...stickerIds])];
          useGameStore.setState({ stickers: merged });
          logger.dev('[Restore] Stickers restored:', merged.length);
        }

        setIsRestored(true);
      } catch (error) {
        logger.error('[Restore] Failed to restore game progress:', error);
      } finally {
        setIsRestoring(false);
      }
    };

    restoreProgress();
  }, []);

  return { isRestoring, isRestored };
}
