/**
 * Sync Service for Jubee Love
 * 
 * Manages bidirectional synchronization between IndexedDB and Supabase.
 * Handles automatic sync, conflict resolution, and retry logic.
 * 
 * @module syncService
 * @see STORAGE_STRATEGY.md for sync architecture
 */

import { supabase } from '@/integrations/supabase/client'
import type { User } from '@supabase/supabase-js'
import { jubeeDB, type DBSchema } from './indexedDB'
import { syncQueue } from './syncQueue'
import { conflictResolver } from './conflictResolver'
import { offlineQueue } from './offlineQueue'
import type { Json } from '@/integrations/supabase/types'
import { logger } from './logger'
import { captureException } from './sentry'

type SyncManager = {
  register: (tag: string) => Promise<void>
}

/**
 * Result of a sync operation
 */
interface SyncResult {
  success: boolean
  synced: number
  failed: number
  errors: string[]
}

/**
 * Sync Service Class
 * 
 * Orchestrates data synchronization between local IndexedDB and Supabase.
 * Provides automatic syncing, manual sync triggers, and conflict resolution.
 */
class SyncService {
  private isSyncing = false
  private syncInterval: NodeJS.Timeout | null = null

  /**
   * Check if the browser is online
   * @returns true if online, false if offline
   */
  isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine
  }

  /**
   * Start automatic synchronization at regular intervals
   * 
   * @param intervalMs - Sync interval in milliseconds (default: 1 minute)
   * 
   * @example
   * ```typescript
   * syncService.startAutoSync(300000); // Sync every 5 minutes
   * ```
   */
  startAutoSync(intervalMs: number = 60000) {
    if (this.syncInterval) return

    this.syncInterval = setInterval(() => {
      if (this.isOnline() && !this.isSyncing) {
        this.syncAll().catch(err => {
            logger.error('Auto sync failed', err)
            captureException(err instanceof Error ? err : new Error(String(err)))
        })
        offlineQueue.processQueue().catch(err => {
            logger.error('Offline queue processing failed', err)
        })
      }
    }, intervalMs)

    // Register for background sync if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        const syncEnabledRegistration = registration as ServiceWorkerRegistration & { sync?: SyncManager }
        if (syncEnabledRegistration.sync) {
          syncEnabledRegistration.sync.register('jubee-sync').catch(err => {
            logger.warn('Background sync registration failed:', err)
          })
        }
      })
    }
  }

  /**
   * Stop automatic synchronization
   * Should be called when component unmounts or app closes
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  /**
   * Sync all stores with Supabase
   */
  async syncAll(): Promise<Record<string, SyncResult>> {
    if (!this.isOnline()) {
      logger.dev('Offline - skipping sync')
      return {}
    }

    if (this.isSyncing) {
      logger.dev('Sync already in progress')
      return {}
    }

    this.isSyncing = true
    const results: Record<string, SyncResult> = {}

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        logger.dev('No authenticated user - skipping sync')
        return {}
      }

      // Sync each store
      results.gameProgress = await this.syncGameProgress(user)
      results.achievements = await this.syncAchievements(user)
      results.drawings = await this.syncDrawings(user)
      results.stickers = await this.syncStickers(user)
      results.childrenProfiles = await this.syncChildrenProfiles(user)

      logger.info('Sync completed:', results)
      return results
    } catch (error) {
      logger.error('Sync error:', error)
      captureException(error instanceof Error ? error : new Error(String(error)))
      return results
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * Synchronize game progress from IndexedDB to Supabase
   * @private
   */
  private async syncGameProgress(user: User): Promise<SyncResult> {
    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] }

    try {
      const unsynced = await jubeeDB.getUnsynced('gameProgress')
      if (unsynced.length === 0) return result
      
      try {
        const batchData = unsynced.map(item => ({
          user_id: user.id,
          child_profile_id: null,
          score: item.score,
          activities_completed: item.activitiesCompleted,
          current_theme: item.currentTheme,
          last_activity: item.lastActivity,
          updated_at: item.updatedAt,
        }))

        const { error } = await supabase
          .from('game_progress')
          .upsert(batchData, {
            onConflict: 'user_id,child_profile_id'
          })

        if (error) throw error

        const syncedItems = unsynced.map(item => ({ ...item, synced: true }))
        await jubeeDB.putBulk('gameProgress', syncedItems)
        result.synced = unsynced.length
      } catch (batchError) {
        logger.warn('Batch sync failed for gameProgress, falling back to individual:', batchError)
        // Fallback to individual
        for (const item of unsynced) {
          try {
            const { error } = await supabase
              .from('game_progress')
              .upsert({
                user_id: user.id,
                child_profile_id: null,
                score: item.score,
                activities_completed: item.activitiesCompleted,
                current_theme: item.currentTheme,
                last_activity: item.lastActivity,
                updated_at: item.updatedAt,
              }, {
                onConflict: 'user_id,child_profile_id'
              })

            if (error) throw error

            await jubeeDB.put('gameProgress', { ...item, synced: true })
            result.synced++
          } catch (error) {
            logger.error('Failed to sync game progress item:', error)
            result.failed++
            result.errors.push(error instanceof Error ? error.message : 'Unknown error')

            syncQueue.add({
              storeName: 'gameProgress',
              operation: 'sync',
              data: item,
              priority: 5
            })
          }
        }
      }
    } catch (error) {
      logger.error('syncGameProgress error:', error)
      result.success = false
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    return result
  }

  /**
   * Synchronize achievements from IndexedDB to Supabase
   * @private
   */
  private async syncAchievements(user: User): Promise<SyncResult> {
    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] }

    try {
      const unsynced = await jubeeDB.getUnsynced('achievements')
      if (unsynced.length === 0) return result
      
      try {
        const batchData = unsynced.map(item => ({
          user_id: user.id,
          child_profile_id: null,
          achievement_id: item.achievementId,
          unlocked_at: item.unlockedAt,
        }))

        const { error } = await supabase
          .from('achievements')
          .upsert(batchData, {
            onConflict: 'user_id,child_profile_id,achievement_id'
          })

        if (error) throw error

        const syncedItems = unsynced.map(item => ({ ...item, synced: true }))
        await jubeeDB.putBulk('achievements', syncedItems)
        result.synced = unsynced.length
      } catch (batchError) {
        logger.warn('Batch sync failed for achievements, falling back to individual:', batchError)
        for (const item of unsynced) {
          try {
            const { error } = await supabase
              .from('achievements')
              .upsert({
                user_id: user.id,
                child_profile_id: null,
                achievement_id: item.achievementId,
                unlocked_at: item.unlockedAt,
              }, {
                onConflict: 'user_id,child_profile_id,achievement_id'
              })

            if (error) throw error

            await jubeeDB.put('achievements', { ...item, synced: true })
            result.synced++
          } catch (error) {
            logger.error('Failed to sync achievement item:', error)
            result.failed++
            result.errors.push(error instanceof Error ? error.message : 'Unknown error')

            syncQueue.add({
              storeName: 'achievements',
              operation: 'sync',
              data: item,
              priority: 4
            })
          }
        }
      }
    } catch (error) {
      logger.error('syncAchievements error:', error)
      result.success = false
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    return result
  }

  /**
   * Synchronize drawings from IndexedDB to Supabase
   * @private
   */
  private async syncDrawings(user: User): Promise<SyncResult> {
    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] }
    const BATCH_SIZE = 10

    try {
      const unsynced = await jubeeDB.getUnsynced('drawings')
      if (unsynced.length === 0) return result
      
      // Process in chunks to avoid payload size issues
      for (let i = 0; i < unsynced.length; i += BATCH_SIZE) {
        const chunk = unsynced.slice(i, i + BATCH_SIZE)

        try {
          const batchData = chunk.map(item => ({
            user_id: user.id,
            child_profile_id: null,
            title: item.title,
            image_data: item.imageData,
            created_at: item.createdAt,
            updated_at: item.updatedAt,
          }))

          const { error } = await supabase
            .from('drawings')
            .insert(batchData)

          if (error) throw error

          const syncedItems = chunk.map(item => ({ ...item, synced: true }))
          await jubeeDB.putBulk('drawings', syncedItems)
          result.synced += chunk.length
        } catch (batchError) {
          logger.warn('Batch sync failed for drawings chunk, falling back to individual:', batchError)
          for (const item of chunk) {
            try {
              const { error } = await supabase
                .from('drawings')
                .insert({
                  user_id: user.id,
                  child_profile_id: null,
                  title: item.title,
                  image_data: item.imageData,
                  created_at: item.createdAt,
                  updated_at: item.updatedAt,
                })

              if (error) throw error

              await jubeeDB.put('drawings', { ...item, synced: true })
              result.synced++
            } catch (error) {
              logger.error('Failed to sync drawing item:', error)
              result.failed++
              result.errors.push(error instanceof Error ? error.message : 'Unknown error')

              syncQueue.add({
                storeName: 'drawings',
                operation: 'sync',
                data: item,
                priority: 3
              })
            }
          }
        }
      }
    } catch (error) {
      logger.error('syncDrawings error:', error)
      result.success = false
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    return result
  }

  /**
   * Synchronize stickers from IndexedDB to Supabase
   * @private
   */
  private async syncStickers(user: User): Promise<SyncResult> {
    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] }

    try {
      const unsynced = await jubeeDB.getUnsynced('stickers')
      if (unsynced.length === 0) return result
      
      try {
        const batchData = unsynced.map(item => ({
          user_id: user.id,
          child_profile_id: null,
          sticker_id: item.stickerId,
          unlocked_at: item.unlockedAt,
        }))

        const { error } = await supabase
          .from('stickers')
          .upsert(batchData, {
            onConflict: 'user_id,child_profile_id,sticker_id'
          })

        if (error) throw error

        const syncedItems = unsynced.map(item => ({ ...item, synced: true }))
        await jubeeDB.putBulk('stickers', syncedItems)
        result.synced = unsynced.length
      } catch (batchError) {
        logger.warn('Batch sync failed for stickers, falling back to individual:', batchError)
        for (const item of unsynced) {
          try {
            const { error } = await supabase
              .from('stickers')
              .upsert({
                user_id: user.id,
                child_profile_id: null,
                sticker_id: item.stickerId,
                unlocked_at: item.unlockedAt,
              }, {
                onConflict: 'user_id,child_profile_id,sticker_id'
              })

            if (error) throw error

            await jubeeDB.put('stickers', { ...item, synced: true })
            result.synced++
          } catch (error) {
            logger.error('Failed to sync sticker item:', error)
            result.failed++
            result.errors.push(error instanceof Error ? error.message : 'Unknown error')

            syncQueue.add({
              storeName: 'stickers',
              operation: 'sync',
              data: item,
              priority: 2
            })
          }
        }
      }
    } catch (error) {
      logger.error('syncStickers error:', error)
      result.success = false
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    return result
  }

  /**
   * Synchronize children profiles from IndexedDB to Supabase
   * @private
   */
  private async syncChildrenProfiles(user: User): Promise<SyncResult> {
    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] }

    try {
      const unsynced = await jubeeDB.getUnsynced('childrenProfiles')
      if (unsynced.length === 0) return result
      
      try {
        const batchData = unsynced.map(item => ({
          id: item.id,
          parent_user_id: user.id,
          name: item.name,
          age: item.age,
          gender: item.gender,
          avatar_url: item.avatarUrl,
          settings: (item.settings as Json) ?? null,
          updated_at: item.updatedAt,
        }))

        const { error } = await supabase
          .from('children_profiles')
          .upsert(batchData)

        if (error) throw error

        const syncedItems = unsynced.map(item => ({ ...item, synced: true }))
        await jubeeDB.putBulk('childrenProfiles', syncedItems)
        result.synced = unsynced.length
      } catch (batchError) {
        logger.warn('Batch sync failed for childrenProfiles, falling back to individual:', batchError)
        for (const item of unsynced) {
          try {
            const { error } = await supabase
              .from('children_profiles')
              .upsert([{
                id: item.id,
                parent_user_id: user.id,
                name: item.name,
                age: item.age,
                gender: item.gender,
                avatar_url: item.avatarUrl,
                settings: (item.settings as Json) ?? null,
                updated_at: item.updatedAt,
              }])

            if (error) throw error

            await jubeeDB.put('childrenProfiles', { ...item, synced: true })
            result.synced++
          } catch (error) {
            logger.error('Failed to sync children profile item:', error)
            result.failed++
            result.errors.push(error instanceof Error ? error.message : 'Unknown error')

            syncQueue.add({
              storeName: 'childrenProfiles',
              operation: 'sync',
              data: item,
              priority: 1
            })
          }
        }
      }
    } catch (error) {
      logger.error('syncChildrenProfiles error:', error)
      result.success = false
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    return result
  }

  /**
   * Pull latest data from Supabase to IndexedDB
   */
  /**
   * Pull latest data from Supabase and update local IndexedDB
   * Server data takes precedence (server wins conflict resolution)
   * 
   * @throws {Error} If pull operation fails
   * 
   * @example
   * ```typescript
   * await syncService.pullFromSupabase();
   * console.log('Local cache updated with server data');
   * ```
   */
  async pullFromSupabase(): Promise<void> {
    if (!this.isOnline()) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Pull game progress
      const { data: gameProgress } = await supabase
        .from('game_progress')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (gameProgress) {
        // Check for conflicts with local data
        const localData = await jubeeDB.get('gameProgress', gameProgress.id)
        
        if (localData && !localData.synced) {
          const conflict = conflictResolver.detectConflicts(
            'gameProgress',
            gameProgress.id,
            localData,
            {
              ...gameProgress,
              score: gameProgress.score,
              activitiesCompleted: gameProgress.activities_completed,
              currentTheme: gameProgress.current_theme,
              lastActivity: gameProgress.last_activity,
              updatedAt: gameProgress.updated_at,
            },
            'Game Progress'
          )
          
          if (conflict) {
            conflictResolver.addConflict(conflict)
            logger.info('Conflict detected for game progress')
            return // Don't overwrite, let user resolve
          }
        }
        
        await jubeeDB.put('gameProgress', {
          id: gameProgress.id,
          score: gameProgress.score ?? 0,
          activitiesCompleted: gameProgress.activities_completed ?? 0,
          currentTheme: gameProgress.current_theme ?? 'default',
          lastActivity: gameProgress.last_activity ?? undefined,
          updatedAt: gameProgress.updated_at ?? new Date().toISOString(),
          synced: true,
        })
      }

      // Pull achievements
      const { data: achievements } = await supabase
        .from('achievements')
        .select('*')

      if (achievements) {
        for (const achievement of achievements) {
          await jubeeDB.put('achievements', {
            id: achievement.id,
            achievementId: achievement.achievement_id,
            unlockedAt: achievement.unlocked_at ?? new Date().toISOString(),
            synced: true,
          })
        }
      }

      // Pull stickers
      const { data: stickers } = await supabase
        .from('stickers')
        .select('*')

      if (stickers) {
        for (const sticker of stickers) {
          await jubeeDB.put('stickers', {
            id: sticker.id,
            stickerId: sticker.sticker_id,
            unlockedAt: sticker.unlocked_at ?? new Date().toISOString(),
            synced: true,
          })
        }
      }

      logger.info('Pull from Supabase completed')
    } catch (error) {
      logger.error('pullFromSupabase error:', error)
      captureException(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Process the sync queue with retry logic
   * Attempts to sync all queued operations
   */
  async processQueue(): Promise<{ processed: number; failed: number; remaining: number }> {
    if (!this.isOnline()) {
      return { processed: 0, failed: 0, remaining: syncQueue.size() }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      logger.error('No authenticated user - cannot process queue')
      return { processed: 0, failed: 0, remaining: syncQueue.size() }
    }

    return await syncQueue.processQueue(async (operation) => {
      const { storeName, data } = operation
      
      // Re-attempt the sync operation based on store name
      switch (storeName) {
        case 'gameProgress':
          await supabase.from('game_progress').upsert({
            user_id: user.id,
            child_profile_id: null,
            score: data.score as number,
            activities_completed: data.activitiesCompleted as number,
            current_theme: data.currentTheme as string,
            last_activity: data.lastActivity as string,
            updated_at: data.updatedAt as string,
          })
          await jubeeDB.put('gameProgress', { ...data, synced: true } as DBSchema['gameProgress']['value'])
          break

        case 'achievements':
          await supabase.from('achievements').upsert({
            user_id: user.id,
            child_profile_id: null,
            achievement_id: data.achievementId as string,
            unlocked_at: data.unlockedAt as string,
          })
          await jubeeDB.put('achievements', { ...data, synced: true } as DBSchema['achievements']['value'])
          break

        case 'drawings':
          await supabase.from('drawings').insert({
            user_id: user.id,
            child_profile_id: null,
            title: data.title as string,
            image_data: data.imageData as string,
            created_at: data.createdAt as string,
            updated_at: data.updatedAt as string,
          })
          await jubeeDB.put('drawings', { ...data, synced: true } as DBSchema['drawings']['value'])
          break

        case 'stickers':
          await supabase.from('stickers').upsert({
            user_id: user.id,
            child_profile_id: null,
            sticker_id: data.stickerId as string,
            unlocked_at: data.unlockedAt as string,
          })
          await jubeeDB.put('stickers', { ...data, synced: true } as DBSchema['stickers']['value'])
          break

        case 'childrenProfiles':
          await supabase.from('children_profiles').upsert([{
            id: data.id as string,
            parent_user_id: user.id,
            name: data.name as string,
            age: data.age as number,
            gender: data.gender as string,
            avatar_url: data.avatarUrl as string,
            settings: (data.settings as Json) ?? null,
            updated_at: data.updatedAt as string,
          }])
          await jubeeDB.put('childrenProfiles', { ...data, synced: true } as DBSchema['childrenProfiles']['value'])
          break

        default:
          throw new Error(`Unknown store: ${storeName}`)
      }
    })
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return syncQueue.getStats()
  }
}

// Export singleton instance
export const syncService = new SyncService()
