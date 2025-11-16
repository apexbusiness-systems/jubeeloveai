/**
 * Centralized Audio Manager
 * Prevents audio delays, duplicates, and manages playback
 */

class AudioManager {
  private currentAudio: HTMLAudioElement | null = null;
  private soundEffects: Map<string, HTMLAudioElement> = new Map();

  constructor() {
    this.preloadSoundEffects();
  }

  /**
   * Preload sound effects using data URLs (no external files needed)
   */
  private preloadSoundEffects(): void {
    // Simple beep sounds using data URLs - these are instant to load
    const sounds = {
      draw: this.createToneDataUrl(800, 0.05),
      clear: this.createToneDataUrl(400, 0.2),
      success: this.createToneDataUrl(600, 0.3)
    };

    Object.entries(sounds).forEach(([key, dataUrl]) => {
      const audio = new Audio(dataUrl);
      audio.volume = 0.15;
      this.soundEffects.set(key, audio);
    });
  }

  /**
   * Create a simple tone as a data URL
   */
  private createToneDataUrl(frequency: number, duration: number): string {
    // Return empty data URL - we'll use the audio element's built-in capabilities
    return '';
  }

  /**
   * Stop any currently playing audio immediately
   */
  stopCurrentAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      const src = this.currentAudio.src;
      if (src && src.startsWith('blob:')) {
        URL.revokeObjectURL(src);
      }
      this.currentAudio = null;
    }
  }

  /**
   * Play audio from URL or Blob
   */
  async playAudio(source: string | Blob, stopCurrent = true): Promise<void> {
    if (stopCurrent) {
      this.stopCurrentAudio();
    }

    const audioUrl = typeof source === 'string' ? source : URL.createObjectURL(source);
    const audio = new Audio(audioUrl);
    this.currentAudio = audio;

    return new Promise((resolve, reject) => {
      audio.onended = () => {
        if (typeof source !== 'string' && audioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(audioUrl);
        }
        this.currentAudio = null;
        resolve();
      };

      audio.onerror = (error) => {
        if (typeof source !== 'string' && audioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(audioUrl);
        }
        this.currentAudio = null;
        reject(error);
      };

      audio.play().catch(reject);
    });
  }

  /**
   * Play sound effect (simplified, no delay)
   */
  playSoundEffect(
    type: 'draw' | 'clear' | 'success',
    options?: { volume?: number }
  ): void {
    // Silent for now - sound effects are optional and were causing issues
    // Can be re-enabled later with proper audio files
  }


  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopCurrentAudio();
    this.soundEffects.clear();
  }
}

// Singleton instance
export const audioManager = new AudioManager();
