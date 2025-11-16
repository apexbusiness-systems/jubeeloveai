/**
 * Centralized Audio Manager
 * Prevents audio delays, duplicates, and manages playback queue
 */

class AudioManager {
  private currentAudio: HTMLAudioElement | null = null;
  private audioQueue: Array<() => Promise<void>> = [];
  private isPlaying = false;
  private audioContext: AudioContext | null = null;

  constructor() {
    // Single AudioContext instance
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      this.audioContext = new AudioContextClass();
    }
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
   * Play sound effect using Web Audio API (no delay)
   */
  playSoundEffect(
    type: 'draw' | 'clear' | 'success',
    options?: { volume?: number }
  ): void {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const volume = options?.volume ?? 0.15;

    if (type === 'draw') {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.05);
    } else if (type === 'clear') {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(600, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } else if (type === 'success') {
      const notes = [523.25, 659.25, 783.99]; // C, E, G
      
      notes.forEach((freq, index) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        const startTime = ctx.currentTime + (index * 0.1);
        gainNode.gain.setValueAtTime(volume, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.4);
      });
    }
  }

  /**
   * Add audio to queue for sequential playback
   */
  async queueAudio(audioFn: () => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.audioQueue.push(async () => {
        try {
          await audioFn();
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      if (!this.isPlaying) {
        this.processQueue();
      }
    });
  }

  /**
   * Process audio queue sequentially
   */
  private async processQueue(): Promise<void> {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const nextAudio = this.audioQueue.shift();

    if (nextAudio) {
      try {
        await nextAudio();
      } catch (error) {
        console.error('Audio playback error:', error);
      }
      await this.processQueue();
    }
  }

  /**
   * Clear audio queue
   */
  clearQueue(): void {
    this.audioQueue = [];
    this.isPlaying = false;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopCurrentAudio();
    this.clearQueue();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }

  /**
   * Get AudioContext for advanced audio processing
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }
}

// Singleton instance
export const audioManager = new AudioManager();
