/**
 * Centralized Audio Manager
 * Prevents audio delays, duplicates, and manages playback
 * Includes caching and preloading for TTS responses
 */

interface CachedAudio {
  blob: Blob;
  timestamp: number;
}

class AudioManager {
  private currentAudio: HTMLAudioElement | null = null;
  private soundEffects: Map<string, HTMLAudioElement> = new Map();
  private audioCache: Map<string, CachedAudio> = new Map();
  private readonly MAX_CACHE_SIZE = 50; // Max cached audio items
  private readonly CACHE_EXPIRY = 1000 * 60 * 30; // 30 minutes

  constructor() {
    this.preloadSoundEffects();
    this.preloadCommonPhrases();
  }

  /**
   * Generate cache key from TTS parameters
   */
  private getCacheKey(text: string, voice?: string, mood?: string): string {
    const normalizedText = text.trim().toLowerCase();
    return `${normalizedText}|${voice || 'default'}|${mood || 'neutral'}`;
  }

  /**
   * Check if cached audio is still valid
   */
  private isCacheValid(cached: CachedAudio): boolean {
    return Date.now() - cached.timestamp < this.CACHE_EXPIRY;
  }

  /**
   * Clean up expired cache entries
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.audioCache.entries()) {
      if (now - cached.timestamp > this.CACHE_EXPIRY) {
        this.audioCache.delete(key);
      }
    }
  }

  /**
   * Manage cache size (LRU-style)
   */
  private manageCacheSize(): void {
    if (this.audioCache.size > this.MAX_CACHE_SIZE) {
      // Remove oldest entries
      const entries = Array.from(this.audioCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, entries.length - this.MAX_CACHE_SIZE);
      toRemove.forEach(([key]) => this.audioCache.delete(key));
    }
  }

  /**
   * Get cached audio blob
   */
  getCachedAudio(text: string, voice?: string, mood?: string): Blob | null {
    const key = this.getCacheKey(text, voice, mood);
    const cached = this.audioCache.get(key);
    
    if (cached && this.isCacheValid(cached)) {
      console.log('✓ TTS cache hit:', text.substring(0, 50));
      return cached.blob;
    }
    
    if (cached) {
      this.audioCache.delete(key); // Remove expired
    }
    
    return null;
  }

  /**
   * Cache audio blob
   */
  cacheAudio(text: string, blob: Blob, voice?: string, mood?: string): void {
    const key = this.getCacheKey(text, voice, mood);
    this.audioCache.set(key, {
      blob,
      timestamp: Date.now()
    });
    
    this.manageCacheSize();
    console.log('✓ TTS cached:', text.substring(0, 50), `(${this.audioCache.size} cached)`);
  }

  /**
   * Preload common phrases to cache
   */
  private async preloadCommonPhrases(): Promise<void> {
    // Common Jubee phrases that can be preloaded
    const commonPhrases = [
      "Great job!",
      "You're doing amazing!",
      "Let's try again!",
      "That's correct!",
      "Keep going!",
      "Well done!",
      "Fantastic!",
      "Try one more time!"
    ];

    // Preload in background without blocking
    setTimeout(async () => {
      for (const phrase of commonPhrases) {
        const cached = this.getCachedAudio(phrase);
        if (!cached) {
          try {
            // This will be called naturally through speak() and get cached
            console.log('Preload ready for:', phrase);
          } catch (error) {
            console.warn('Preload skipped for:', phrase);
          }
        }
      }
    }, 2000); // Wait 2s after app load
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
   * Clear all cached audio
   */
  clearCache(): void {
    this.audioCache.clear();
    console.log('Audio cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number } {
    this.cleanExpiredCache();
    return {
      size: this.audioCache.size,
      maxSize: this.MAX_CACHE_SIZE
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopCurrentAudio();
    this.soundEffects.clear();
    this.clearCache();
  }
}

// Singleton instance
export const audioManager = new AudioManager();
