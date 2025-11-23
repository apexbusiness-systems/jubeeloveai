import { useCallback } from 'react';
import { audioManager } from '@/lib/audioManager';

export const useAudioEffects = () => {
  const playDrawSound = useCallback(() => {
    audioManager.playSoundEffect('draw');
  }, []);

  const playClearSound = useCallback(() => {
    audioManager.playSoundEffect('clear');
  }, []);

  const playSuccessSound = useCallback(() => {
    audioManager.playSoundEffect('success');
  }, []);

  return {
    playDrawSound,
    playClearSound,
    playSuccessSound,
  };
};
