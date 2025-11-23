/**
 * Storage Versioning & Migration System
 * Handles data schema migrations when app structure changes
 */

const CURRENT_VERSION = 2;
const VERSION_KEY = 'jubee-storage-version';

interface MigrationFunction {
  (data: unknown): unknown;
}

const migrations: Record<number, MigrationFunction> = {
  // Migration from v1 to v2: Add synced flag to all data
  1: (data: unknown) => {
    if (Array.isArray(data)) {
      return data.map(item => ({
        ...item,
        synced: item.synced ?? false
      }));
    }
    return data;
  },
  
  // Future migrations go here
  // 2: (data) => { /* migration logic */ },
};

/**
 * Get current storage version
 */
export function getStorageVersion(): number {
  const version = localStorage.getItem(VERSION_KEY);
  return version ? parseInt(version, 10) : 0;
}

/**
 * Set storage version
 */
export function setStorageVersion(version: number): void {
  localStorage.setItem(VERSION_KEY, version.toString());
}

/**
 * Run migrations to bring storage up to current version
 */
export function runMigrations(): void {
  const currentVersion = getStorageVersion();
  
  if (currentVersion === CURRENT_VERSION) {
    return; // Already up to date
  }
  
  console.log(`[Storage Migration] Upgrading from v${currentVersion} to v${CURRENT_VERSION}`);
  
  // Run migrations in order
  for (let version = currentVersion; version < CURRENT_VERSION; version++) {
    const migration = migrations[version];
    if (migration) {
      try {
        // Migrate all relevant storage keys
        const keysToMigrate = [
          'jubee-game-progress',
          'jubee-achievements', 
          'jubee-drawings',
          'jubee-stickers'
        ];
        
        keysToMigrate.forEach(key => {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const parsed = JSON.parse(data);
              const migrated = migration(parsed);
              localStorage.setItem(key, JSON.stringify(migrated));
            } catch (error) {
              console.error(`[Storage Migration] Failed to migrate ${key}:`, error);
            }
          }
        });
        
        console.log(`[Storage Migration] Completed migration from v${version} to v${version + 1}`);
      } catch (error) {
        console.error(`[Storage Migration] Failed at version ${version}:`, error);
      }
    }
  }
  
  setStorageVersion(CURRENT_VERSION);
  console.log('[Storage Migration] All migrations completed');
}

/**
 * Validate data structure
 */
export function validateStoredData<T>(data: unknown, validator: (data: unknown) => data is T): data is T {
  return validator(data);
}

/**
 * Safe storage wrapper with versioning
 */
export function versionedSetItem<T>(key: string, value: T): void {
  const versionedData = {
    version: CURRENT_VERSION,
    data: value,
    timestamp: Date.now()
  };
  
  try {
    localStorage.setItem(key, JSON.stringify(versionedData));
  } catch (error) {
    console.error(`[Versioned Storage] Failed to save ${key}:`, error);
    throw error;
  }
}

/**
 * Safe storage retrieval with versioning
 */
export function versionedGetItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    
    const parsed = JSON.parse(item);
    
    // Check if it's versioned data
    if (parsed.version !== undefined) {
      if (parsed.version !== CURRENT_VERSION) {
        console.warn(`[Versioned Storage] ${key} is outdated (v${parsed.version}), using default`);
        return defaultValue;
      }
      return parsed.data as T;
    }
    
    // Legacy data without versioning
    return parsed as T;
  } catch (error) {
    console.error(`[Versioned Storage] Failed to load ${key}:`, error);
    return defaultValue;
  }
}
