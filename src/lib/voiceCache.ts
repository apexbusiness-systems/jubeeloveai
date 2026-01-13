/**
 * Persistent Voice Cache for Jubee
 * 
 * Stores TTS audio in IndexedDB for offline playback and faster response times.
 * Includes LRU eviction, expiration, and automatic preloading of common phrases.
 */

const VOICE_CACHE_DB = 'jubee-voice-cache';
const VOICE_CACHE_VERSION = 1;
const STORE_NAME = 'audio';

interface CachedVoiceEntry {
  key: string;
  blob: Blob;
  text: string;
  voice: string;
  mood: string;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
}

interface VoiceCacheStats {
  totalEntries: number;
  totalSizeBytes: number;
  oldestEntry: number | null;
  newestEntry: number | null;
  mostAccessed: string | null;
}

// Common phrases to preload for offline support
const COMMON_PHRASES = [
  { text: "Hi there! Ready to play?", mood: "happy" },
  { text: "Great job! You're doing amazing!", mood: "excited" },
  { text: "Let's try again, you can do it!", mood: "happy" },
  { text: "Wow, that's fantastic!", mood: "excited" },
  { text: "Time to have some fun!", mood: "happy" },
  { text: "You're a superstar!", mood: "excited" },
  { text: "Let's learn something new today!", mood: "curious" },
  { text: "I'm so proud of you!", mood: "happy" },
  { text: "See you next time!", mood: "happy" },
  { text: "Welcome back! I missed you!", mood: "excited" },
];

class VoiceCacheService {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;
  private isSupported: boolean;
  private memoryCache: Map<string, { blob: Blob; timestamp: number }> = new Map();
  
  // Cache limits
  private readonly MAX_ENTRIES = 100;
  private readonly MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
  private readonly EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly MEMORY_CACHE_SIZE = 20;

  constructor() {
    this.isSupported = typeof indexedDB !== 'undefined';
  }

  /**
   * Initialize the voice cache database
   */
  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.dbPromise) return this.dbPromise;

    if (!this.isSupported) {
      throw new Error('IndexedDB not supported');
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(VOICE_CACHE_DB, VOICE_CACHE_VERSION);

      request.onerror = () => {
        console.error('Voice cache DB error:', request.error);
        reject(new Error('Failed to open voice cache'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('accessCount', 'accessCount', { unique: false });
          store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        }
      };
    });

    return this.dbPromise;
  }

  /**
   * Generate cache key from TTS parameters
   */
  private getCacheKey(text: string, voice: string = 'default', mood: string = 'happy'): string {
    const normalizedText = text.trim().toLowerCase().substring(0, 200);
    return `${normalizedText}|${voice}|${mood}`;
  }

  /**
   * Get cached audio (checks memory first, then IndexedDB)
   */
  async get(text: string, voice?: string, mood?: string): Promise<Blob | null> {
    const key = this.getCacheKey(text, voice, mood);

    // Check memory cache first (fastest)
    const memCached = this.memoryCache.get(key);
    if (memCached && Date.now() - memCached.timestamp < this.EXPIRY_MS) {
      return memCached.blob;
    }

    // Check IndexedDB
    try {
      const db = await this.init();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => {
          const entry = request.result as CachedVoiceEntry | undefined;
          
          if (!entry) {
            resolve(null);
            return;
          }

          // Check expiration
          if (Date.now() - entry.timestamp > this.EXPIRY_MS) {
            store.delete(key);
            resolve(null);
            return;
          }

          // Update access stats
          entry.accessCount++;
          entry.lastAccessed = Date.now();
          store.put(entry);

          // Add to memory cache
          this.addToMemoryCache(key, entry.blob);

          resolve(entry.blob);
        };

        request.onerror = () => {
          console.warn('Voice cache get error');
          resolve(null);
        };
      });
    } catch (error) {
      console.warn('Voice cache error:', error);
      return null;
    }
  }

  /**
   * Store audio in cache
   */
  async set(text: string, blob: Blob, voice?: string, mood?: string): Promise<void> {
    const key = this.getCacheKey(text, voice, mood);

    // Add to memory cache
    this.addToMemoryCache(key, blob);

    try {
      await this.ensureSpace(blob.size);
      
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const entry: CachedVoiceEntry = {
          key,
          blob,
          text: text.substring(0, 200),
          voice: voice || 'default',
          mood: mood || 'happy',
          timestamp: Date.now(),
          accessCount: 1,
          lastAccessed: Date.now(),
          size: blob.size,
        };

        const request = store.put(entry);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to cache voice'));
      });
    } catch (error) {
      console.warn('Voice cache set error:', error);
    }
  }

  /**
   * Add to fast memory cache with LRU eviction
   */
  private addToMemoryCache(key: string, blob: Blob): void {
    // Evict oldest if at capacity
    if (this.memoryCache.size >= this.MEMORY_CACHE_SIZE) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      
      for (const [k, v] of this.memoryCache.entries()) {
        if (v.timestamp < oldestTime) {
          oldestTime = v.timestamp;
          oldestKey = k;
        }
      }
      
      if (oldestKey) {
        this.memoryCache.delete(oldestKey);
      }
    }

    this.memoryCache.set(key, { blob, timestamp: Date.now() });
  }

  /**
   * Ensure enough space for new entry
   */
  private async ensureSpace(requiredBytes: number): Promise<void> {
    try {
      const db = await this.init();
      const stats = await this.getStats();

      // Check if we need to free space
      if (stats.totalEntries >= this.MAX_ENTRIES || 
          stats.totalSizeBytes + requiredBytes > this.MAX_SIZE_BYTES) {
        await this.evictLeastUsed(db);
      }
    } catch (error) {
      console.warn('Space check failed:', error);
    }
  }

  /**
   * Evict least recently used entries
   */
  private async evictLeastUsed(db: IDBDatabase): Promise<void> {
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('lastAccessed');
      
      // Get entries sorted by last accessed
      const request = index.openCursor();
      let evicted = 0;
      const TARGET_EVICTION = 10;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        
        if (cursor && evicted < TARGET_EVICTION) {
          cursor.delete();
          evicted++;
          cursor.continue();
        } else {
          console.log(`✓ Evicted ${evicted} voice cache entries`);
          resolve();
        }
      };

      request.onerror = () => resolve();
    });
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<VoiceCacheStats> {
    const stats: VoiceCacheStats = {
      totalEntries: 0,
      totalSizeBytes: 0,
      oldestEntry: null,
      newestEntry: null,
      mostAccessed: null,
    };

    try {
      const db = await this.init();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const entries = request.result as CachedVoiceEntry[];
          
          stats.totalEntries = entries.length;
          
          let maxAccess = 0;
          
          for (const entry of entries) {
            stats.totalSizeBytes += entry.size;
            
            if (!stats.oldestEntry || entry.timestamp < stats.oldestEntry) {
              stats.oldestEntry = entry.timestamp;
            }
            if (!stats.newestEntry || entry.timestamp > stats.newestEntry) {
              stats.newestEntry = entry.timestamp;
            }
            if (entry.accessCount > maxAccess) {
              maxAccess = entry.accessCount;
              stats.mostAccessed = entry.text;
            }
          }

          resolve(stats);
        };

        request.onerror = () => resolve(stats);
      });
    } catch {
      return stats;
    }
  }

  /**
   * Preload common phrases for offline support
   */
  async preloadCommonPhrases(
    fetchAudio: (text: string, mood: string) => Promise<Blob | null>
  ): Promise<void> {
    console.log('🔊 Preloading common voice phrases for offline...');
    
    let loaded = 0;
    
    for (const phrase of COMMON_PHRASES) {
      try {
        // Check if already cached
        const cached = await this.get(phrase.text, 'default', phrase.mood);
        if (cached) {
          loaded++;
          continue;
        }

        // Fetch and cache
        const blob = await fetchAudio(phrase.text, phrase.mood);
        if (blob) {
          await this.set(phrase.text, blob, 'default', phrase.mood);
          loaded++;
        }

        // Small delay to avoid overwhelming the API
        await new Promise(r => setTimeout(r, 200));
      } catch (error) {
        console.debug('Preload skip:', phrase.text.substring(0, 30));
      }
    }

    console.log(`✓ Voice cache: ${loaded}/${COMMON_PHRASES.length} phrases ready for offline`);
  }

  /**
   * Clear expired entries
   */
  async clearExpired(): Promise<number> {
    try {
      const db = await this.init();
      const now = Date.now();
      
      return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        
        let cleared = 0;

        request.onsuccess = () => {
          const entries = request.result as CachedVoiceEntry[];
          
          for (const entry of entries) {
            if (now - entry.timestamp > this.EXPIRY_MS) {
              store.delete(entry.key);
              cleared++;
            }
          }

          resolve(cleared);
        };

        request.onerror = () => resolve(0);
      });
    } catch {
      return 0;
    }
  }

  /**
   * Clear all cached audio
   */
  async clearAll(): Promise<void> {
    this.memoryCache.clear();

    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
          console.log('✓ Voice cache cleared');
          resolve();
        };
        request.onerror = () => reject(new Error('Failed to clear voice cache'));
      });
    } catch (error) {
      console.warn('Clear cache error:', error);
    }
  }

  /**
   * Check if offline mode is available (has cached phrases)
   */
  async isOfflineReady(): Promise<boolean> {
    const stats = await this.getStats();
    return stats.totalEntries >= COMMON_PHRASES.length / 2;
  }
}

// Singleton instance
export const voiceCache = new VoiceCacheService();
