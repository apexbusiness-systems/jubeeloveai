import { useEffect, useRef } from 'react';
import { debounce } from '@/lib/utils';

/**
 * Hook for automatic data persistence with debouncing
 * Prevents excessive localStorage writes
 */
export function useDataPersistence<T>(
  key: string,
  data: T,
  options: {
    debounceMs?: number;
    enabled?: boolean;
  } = {}
) {
  const {
    debounceMs = 500,
    enabled = true
  } = options;

  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip persistence on initial mount to avoid overwriting with defaults
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!enabled) return;

    const debouncedSave = debounce(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`[Persistence] Saved ${key}`);
      } catch (error) {
        console.error(`[Persistence] Failed to save ${key}:`, error);
      }
    }, debounceMs);

    debouncedSave();

    return () => {
      debouncedSave.cancel?.();
    };
  }, [data, key, debounceMs, enabled]);
}

/**
 * Load persisted data with type safety
 */
export function loadPersistedData<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`[Persistence] Failed to load ${key}:`, error);
    return defaultValue;
  }
}
