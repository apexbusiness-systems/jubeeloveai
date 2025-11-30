/**
 * Jubee State Backup Service
 * 
 * Provides IndexedDB backup for critical mascot state with versioning.
 * Ensures state can be recovered even if localStorage is cleared.
 * 
 * @module jubeeStateBackup
 */

import { jubeeDB } from './indexedDB'
import { logger } from './logger'

export interface JubeeStateBackup {
  id: string
  version: number
  timestamp: number
  state: {
    gender: 'male' | 'female'
    voice: string
    position: { x: number; y: number; z: number }
    containerPosition: { bottom: number; right: number }
    isVisible: boolean
    currentAnimation: string
  }
  metadata: {
    viewportWidth: number
    viewportHeight: number
    userAgent: string
    recoveryLevel: number
  }
  synced: boolean
}

const BACKUP_STORE_NAME = 'jubeeStateBackups' as const
const BACKUP_VERSION = 1
const MAX_BACKUPS = 20 // Keep last 20 backups
const BACKUP_INTERVAL = 30000 // Backup every 30 seconds
const BACKUP_KEY = 'jubee-state-backup'

class JubeeStateBackupService {
  private backupIntervalId: NodeJS.Timeout | null = null
  private isInitialized = false

  /**
   * Initialize the backup service
   */
  async init(): Promise<void> {
    if (this.isInitialized) return

    try {
      await jubeeDB.init()
      this.isInitialized = true
      logger.dev('[Jubee Backup] Service initialized')
    } catch (error) {
      logger.error('[Jubee Backup] Initialization failed:', error)
    }
  }

  /**
   * Create a backup of current state
   */
  async createBackup(state: JubeeStateBackup['state']): Promise<boolean> {
    if (!this.isInitialized) {
      await this.init()
    }

    try {
      const backup: JubeeStateBackup = {
        id: `${BACKUP_KEY}-${Date.now()}`,
        version: BACKUP_VERSION,
        timestamp: Date.now(),
        state: {
          gender: state.gender,
          voice: state.voice,
          position: { ...state.position },
          containerPosition: { ...state.containerPosition },
          isVisible: state.isVisible,
          currentAnimation: state.currentAnimation
        },
        metadata: {
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          userAgent: navigator.userAgent,
          recoveryLevel: 0
        },
        synced: false
      }

      // Store in IndexedDB (using childrenProfiles store as fallback structure)
      // In a real implementation, you'd add a dedicated store
      await jubeeDB.put('childrenProfiles', {
        id: backup.id,
        name: 'jubee-state-backup',
        age: backup.version,
        gender: backup.state.gender,
        avatarUrl: undefined,
        settings: {
          state: backup.state,
          metadata: backup.metadata
        },
        updatedAt: new Date(backup.timestamp).toISOString(),
        synced: backup.synced
      })

      // Also store in localStorage as immediate fallback
      try {
        const backups = this.getLocalBackups()
        backups.push(backup)
        
        // Keep only last MAX_BACKUPS
        if (backups.length > MAX_BACKUPS) {
          backups.shift()
        }
        
        localStorage.setItem(BACKUP_KEY, JSON.stringify(backups))
      } catch (error) {
        logger.warn('[Jubee Backup] localStorage backup failed:', error)
      }

      logger.dev('[Jubee Backup] Backup created:', backup.id)
      return true
    } catch (error) {
      logger.error('[Jubee Backup] Backup creation failed:', error)
      return false
    }
  }

  /**
   * Get the most recent backup
   */
  async getLatestBackup(): Promise<JubeeStateBackup | null> {
    try {
      // Try localStorage first (faster)
      const localBackups = this.getLocalBackups()
      if (localBackups.length > 0) {
        const latest = localBackups[localBackups.length - 1]
        logger.dev('[Jubee Backup] Retrieved latest backup from localStorage')
        return latest
      }

      // Fallback to IndexedDB
      const all = await jubeeDB.getAll('childrenProfiles')
      const backups = all
        .filter((item) => item.id?.startsWith(BACKUP_KEY))
        .map((item) => {
          const settings = item.settings as { state?: unknown; metadata?: unknown }
          return {
            id: item.id,
            version: BACKUP_VERSION,
            timestamp: new Date(item.updatedAt).getTime(),
            state: settings.state as JubeeStateBackup['state'],
            metadata: settings.metadata as JubeeStateBackup['metadata'],
            synced: item.synced
          } as JubeeStateBackup
        })
        .sort((a, b) => b.timestamp - a.timestamp)

      if (backups.length > 0) {
        logger.dev('[Jubee Backup] Retrieved latest backup from IndexedDB')
        return backups[0]
      }

      return null
    } catch (error) {
      logger.error('[Jubee Backup] Failed to get latest backup:', error)
      return null
    }
  }

  /**
   * Restore state from backup
   */
  async restoreFromBackup(backupId?: string): Promise<JubeeStateBackup['state'] | null> {
    try {
      let backup: JubeeStateBackup | null = null

      if (backupId) {
        // Get specific backup
        const localBackups = this.getLocalBackups()
        backup = localBackups.find((b) => b.id === backupId) || null
      } else {
        // Get latest backup
        backup = await this.getLatestBackup()
      }

      if (!backup) {
        logger.warn('[Jubee Backup] No backup found to restore')
        return null
      }

      logger.dev('[Jubee Backup] Restoring from backup:', backup.id)
      return backup.state
    } catch (error) {
      logger.error('[Jubee Backup] Restore failed:', error)
      return null
    }
  }

  /**
   * Get all backups from localStorage
   */
  private getLocalBackups(): JubeeStateBackup[] {
    try {
      const stored = localStorage.getItem(BACKUP_KEY)
      if (!stored) return []
      return JSON.parse(stored) as JubeeStateBackup[]
    } catch (error) {
      logger.error('[Jubee Backup] Failed to read localStorage backups:', error)
      return []
    }
  }

  /**
   * Start automatic periodic backups
   */
  startAutoBackup(getState: () => JubeeStateBackup['state']): void {
    if (this.backupIntervalId) {
      this.stopAutoBackup()
    }

    // Create initial backup
    this.createBackup(getState())

    // Set up periodic backups
    this.backupIntervalId = setInterval(() => {
      this.createBackup(getState())
    }, BACKUP_INTERVAL)

    logger.dev('[Jubee Backup] Auto-backup started')
  }

  /**
   * Stop automatic backups
   */
  stopAutoBackup(): void {
    if (this.backupIntervalId) {
      clearInterval(this.backupIntervalId)
      this.backupIntervalId = null
      logger.dev('[Jubee Backup] Auto-backup stopped')
    }
  }

  /**
   * Clear old backups (keep only last N)
   */
  async clearOldBackups(keepCount: number = MAX_BACKUPS): Promise<void> {
    try {
      const backups = this.getLocalBackups()
      if (backups.length > keepCount) {
        const toKeep = backups.slice(-keepCount)
        localStorage.setItem(BACKUP_KEY, JSON.stringify(toKeep))
        logger.dev('[Jubee Backup] Cleared old backups, kept', toKeep.length)
      }
    } catch (error) {
      logger.error('[Jubee Backup] Failed to clear old backups:', error)
    }
  }
}

// Singleton instance
export const jubeeStateBackupService = new JubeeStateBackupService()

