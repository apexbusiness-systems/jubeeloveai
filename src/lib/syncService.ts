/**
 * Sync Service for syncing offline data with Supabase
 * Handles bidirectional sync with conflict resolution
 */

import { supabase } from '@/integrations/supabase/client'
import { jubeeDB } from './indexedDB'

interface SyncResult {
  success: boolean
  synced: number
  failed: number
  errors: string[]
}

class SyncService {
  private isSyncing = false
  private syncInterval: NodeJS.Timeout | null = null

  /**
   * Check if the browser is online
   */
  isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine
  }

  /**
   * Start automatic sync interval
   */
  startAutoSync(intervalMs: number = 60000) {
    if (this.syncInterval) return

    this.syncInterval = setInterval(() => {
      if (this.isOnline() && !this.isSyncing) {
        this.syncAll().catch(console.error)
      }
    }, intervalMs)
  }

  /**
   * Stop automatic sync
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
      console.log('Offline - skipping sync')
      return {}
    }

    if (this.isSyncing) {
      console.log('Sync already in progress')
      return {}
    }

    this.isSyncing = true
    const results: Record<string, SyncResult> = {}

    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.log('No active session - skipping sync')
        return {}
      }

      // Sync each store
      results.gameProgress = await this.syncGameProgress()
      results.achievements = await this.syncAchievements()
      results.drawings = await this.syncDrawings()
      results.stickers = await this.syncStickers()
      results.childrenProfiles = await this.syncChildrenProfiles()

      console.log('Sync completed:', results)
      return results
    } catch (error) {
      console.error('Sync error:', error)
      return results
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * Sync game progress
   */
  private async syncGameProgress(): Promise<SyncResult> {
    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] }

    try {
      const unsynced = await jubeeDB.getUnsynced('gameProgress')
      
      for (const item of unsynced) {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) continue

          const { error } = await supabase
            .from('game_progress')
            .upsert({
              user_id: user.id,
              child_profile_id: null, // Will be updated when child profiles are implemented
              score: item.score,
              activities_completed: item.activitiesCompleted,
              current_theme: item.currentTheme,
              last_activity: item.lastActivity,
              updated_at: item.updatedAt,
            }, {
              onConflict: 'user_id,child_profile_id'
            })

          if (error) throw error

          // Mark as synced
          await jubeeDB.put('gameProgress', { ...item, synced: true })
          result.synced++
        } catch (error) {
          console.error('Failed to sync game progress item:', error)
          result.failed++
          result.errors.push(error instanceof Error ? error.message : 'Unknown error')
        }
      }
    } catch (error) {
      console.error('syncGameProgress error:', error)
      result.success = false
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    return result
  }

  /**
   * Sync achievements
   */
  private async syncAchievements(): Promise<SyncResult> {
    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] }

    try {
      const unsynced = await jubeeDB.getUnsynced('achievements')
      
      for (const item of unsynced) {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) continue

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
          console.error('Failed to sync achievement item:', error)
          result.failed++
          result.errors.push(error instanceof Error ? error.message : 'Unknown error')
        }
      }
    } catch (error) {
      console.error('syncAchievements error:', error)
      result.success = false
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    return result
  }

  /**
   * Sync drawings
   */
  private async syncDrawings(): Promise<SyncResult> {
    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] }

    try {
      const unsynced = await jubeeDB.getUnsynced('drawings')
      
      for (const item of unsynced) {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) continue

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
          console.error('Failed to sync drawing item:', error)
          result.failed++
          result.errors.push(error instanceof Error ? error.message : 'Unknown error')
        }
      }
    } catch (error) {
      console.error('syncDrawings error:', error)
      result.success = false
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    return result
  }

  /**
   * Sync stickers
   */
  private async syncStickers(): Promise<SyncResult> {
    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] }

    try {
      const unsynced = await jubeeDB.getUnsynced('stickers')
      
      for (const item of unsynced) {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) continue

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
          console.error('Failed to sync sticker item:', error)
          result.failed++
          result.errors.push(error instanceof Error ? error.message : 'Unknown error')
        }
      }
    } catch (error) {
      console.error('syncStickers error:', error)
      result.success = false
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    return result
  }

  /**
   * Sync children profiles
   */
  private async syncChildrenProfiles(): Promise<SyncResult> {
    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] }

    try {
      const unsynced = await jubeeDB.getUnsynced('childrenProfiles')
      
      for (const item of unsynced) {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) continue

          const { error } = await supabase
            .from('children_profiles')
            .upsert({
              parent_user_id: user.id,
              name: item.name,
              age: item.age,
              gender: item.gender,
              avatar_url: item.avatarUrl,
              settings: item.settings,
              updated_at: item.updatedAt,
            })

          if (error) throw error

          await jubeeDB.put('childrenProfiles', { ...item, synced: true })
          result.synced++
        } catch (error) {
          console.error('Failed to sync children profile item:', error)
          result.failed++
          result.errors.push(error instanceof Error ? error.message : 'Unknown error')
        }
      }
    } catch (error) {
      console.error('syncChildrenProfiles error:', error)
      result.success = false
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    return result
  }

  /**
   * Pull latest data from Supabase to IndexedDB
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
        await jubeeDB.put('gameProgress', {
          id: gameProgress.id,
          score: gameProgress.score,
          activitiesCompleted: gameProgress.activities_completed,
          currentTheme: gameProgress.current_theme,
          lastActivity: gameProgress.last_activity,
          updatedAt: gameProgress.updated_at,
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
            unlockedAt: achievement.unlocked_at,
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
            unlockedAt: sticker.unlocked_at,
            synced: true,
          })
        }
      }

      console.log('Pull from Supabase completed')
    } catch (error) {
      console.error('pullFromSupabase error:', error)
    }
  }
}

// Export singleton instance
export const syncService = new SyncService()
