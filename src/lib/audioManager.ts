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
  private audioContext: AudioContext | null = null;
  private isAudioUnlocked = false;

  constructor() {
    this.preloadSoundEffects();
    this.preloadCommonPhrases();
    this.setupAudioUnlock();
  }

  /**
   * Setup user interaction listeners to unlock audio on mobile
   * Required for PWA/mobile where audio is blocked until user interaction
   */
  private setupAudioUnlock(): void {
    if (typeof window === 'undefined') return;

    const unlockAudio = async () => {
      if (this.isAudioUnlocked) return;

      try {
        // Create and resume AudioContext
        if (!this.audioContext) {
          this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }

        // Play a silent buffer to unlock audio
        const buffer = this.audioContext.createBuffer(1, 1, 22050);
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.start(0);

        this.isAudioUnlocked = true;
        console.log('✓ Audio unlocked for PWA/mobile');

        // Remove listeners once unlocked
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('touchend', unlockAudio);
        document.removeEventListener('click', unlockAudio);
      } catch (error) {
        console.warn('Audio unlock failed:', error);
      }
    };

    // Listen for user interaction to unlock audio
    document.addEventListener('touchstart', unlockAudio, { once: false, passive: true });
    document.addEventListener('touchend', unlockAudio, { once: false, passive: true });
    document.addEventListener('click', unlockAudio, { once: false, passive: true });
  }

  /**
   * Ensure audio is ready for playback
   */
  async ensureAudioReady(): Promise<boolean> {
    if (this.isAudioUnlocked) return true;

    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.isAudioUnlocked = this.audioContext.state === 'running';
      return this.isAudioUnlocked;
    } catch {
      return false;
    }
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
   * Preload common phrases to cache (now handled by smart preloader)
   */
  private async preloadCommonPhrases(): Promise<void> {
    // Handled by useSmartAudioPreloader hook
  }

  /**
   * Preload audio in background without blocking
   */
  async preloadAudio(
    text: string, 
    voice?: string, 
    mood?: string,
    priority: 'high' | 'low' = 'low'
  ): Promise<void> {
    // Check if already cached
    if (this.getCachedAudio(text, voice, mood)) {
      return
    }

    // Use idle callback for low priority preloads
    const executePreload = async () => {
      try {
        const response = await fetch('https://kphdqgidwipqdthehckg.supabase.co/functions/v1/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text, 
            voice: voice || 'shimmer',
            mood: mood || 'happy',
            gender: 'female',
            language: 'en'
          }),
          signal: AbortSignal.timeout(8000)
        })

        if (response.ok) {
          const blob = await response.blob()
          this.cacheAudio(text, blob, voice, mood)
          console.log('✓ Preloaded:', text.substring(0, 40))
        }
      } catch (error) {
        // Silent fail for preloads - not critical
        console.debug('Preload skipped:', text.substring(0, 40))
      }
    }

    if (priority === 'high') {
      // Execute immediately for high priority
      await executePreload()
    } else {
      // Use idle callback for low priority
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(executePreload, { timeout: 5000 })
      } else {
        setTimeout(executePreload, 100)
      }
    }
  }

  /**
   * Batch preload multiple phrases
   */
  async batchPreload(
    phrases: Array<{ text: string; voice?: string; mood?: string; priority?: 'high' | 'low' }>
  ): Promise<void> {
    // Limit concurrent preloads to avoid overwhelming the system
    const MAX_CONCURRENT = 3
    const queue = [...phrases]
    
    while (queue.length > 0) {
      const batch = queue.splice(0, MAX_CONCURRENT)
      await Promise.allSettled(
        batch.map(p => this.preloadAudio(p.text, p.voice, p.mood, p.priority))
      )
    }
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
   * Pause currently playing audio
   */
  pauseAudio(): void {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
    }
  }

  /**
   * Resume currently paused audio
   */
  resumeAudio(): void {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play().catch(err => console.error('Error resuming audio:', err));
    }
  }

  /**
   * Set playback speed (0.5 to 2.0)
   */
  setPlaybackSpeed(speed: number): void {
    if (this.currentAudio) {
      this.currentAudio.playbackRate = Math.max(0.5, Math.min(2.0, speed));
    }
  }

  /**
   * Check if audio is currently playing
   */
  isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }

  /**
   * Check if audio is paused
   */
  isPaused(): boolean {
    return this.currentAudio !== null && this.currentAudio.paused;
  }

  /**
   * Play audio from URL or Blob
   */
  async playAudio(source: string | Blob, stopCurrent = true, volume = 1.0): Promise<void> {
    // Ensure audio is unlocked before playing
    await this.ensureAudioReady();

    if (stopCurrent) {
      this.stopCurrentAudio();
    }

    const audioUrl = typeof source === 'string' ? source : URL.createObjectURL(source);
    const audio = new Audio(audioUrl);
    audio.volume = Math.max(0, Math.min(1, volume));
    
    // Set attributes for mobile compatibility
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    
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
        console.error('Audio playback error:', error);
        if (typeof source !== 'string' && audioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(audioUrl);
        }
        this.currentAudio = null;
        reject(error);
      };

      audio.play().catch((err) => {
        console.error('Audio play failed:', err);
        // Try to unlock and retry once
        this.ensureAudioReady().then(() => {
          audio.play().catch(reject);
        });
      });
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
