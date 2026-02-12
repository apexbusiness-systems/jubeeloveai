/**
 * IndexedDB Service for Jubee Love
 * 
 * Provides offline-first data persistence with Supabase sync capabilities.
 * Falls back to localStorage if IndexedDB is unavailable.
 * 
 * @module indexedDB
 * @see STORAGE_STRATEGY.md for architecture decisions
 */

import { logger } from './logger'

const DB_NAME = 'jubee-love-db'
const DB_VERSION = 1

/**
 * IndexedDB Schema Definition
 * Defines all object stores and their data structures
 */
export interface DBSchema {
  gameProgress: {
    key: string
    value: {
      id: string
      score: number
      activitiesCompleted: number
      currentTheme: string
      lastActivity?: string
      updatedAt: string
      synced: boolean
    }
  }
  achievements: {
    key: string
    value: {
      id: string
      achievementId: string
      unlockedAt: string
      synced: boolean
    }
  }
  drawings: {
    key: string
    value: {
      id: string
      title?: string
      imageData: string
      createdAt: string
      updatedAt: string
      synced: boolean
    }
  }
  stickers: {
    key: string
    value: {
      id: string
      stickerId: string
      unlockedAt: string
      synced: boolean
    }
  }
  childrenProfiles: {
    key: string
    value: {
      id: string
      name: string
      age: number
      gender: string
      avatarUrl?: string
      settings: Record<string, unknown>
      updatedAt: string
      synced: boolean
    }
  }
}

/**
 * IndexedDB Service Class
 * 
 * Manages all IndexedDB operations with automatic localStorage fallback.
 * Provides CRUD operations for all data stores with sync tracking.
 */
export class IndexedDBService {
  private db: IDBDatabase | null = null
  private dbPromise: Promise<IDBDatabase> | null = null
  private isSupported: boolean

  constructor() {
    this.isSupported = typeof indexedDB !== 'undefined'
  }

  /**
   * Initialize the IndexedDB database
   * Creates object stores if they don't exist
   * 
   * @returns Promise resolving to the database instance
   * @throws {Error} If IndexedDB is not supported or initialization fails
   */
  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db

    if (this.dbPromise) return this.dbPromise

    if (!this.isSupported) {
      throw new Error('IndexedDB is not supported in this browser')
    }

    this.dbPromise = new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onerror = () => {
          logger.error('IndexedDB error:', request.error)
          reject(new Error('Failed to open IndexedDB'))
        }

        request.onsuccess = () => {
          this.db = request.result
          resolve(this.db)
        }

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result

          // Create object stores
          if (!db.objectStoreNames.contains('gameProgress')) {
            db.createObjectStore('gameProgress', { keyPath: 'id' })
          }
          if (!db.objectStoreNames.contains('achievements')) {
            const achievementStore = db.createObjectStore('achievements', { keyPath: 'id' })
            achievementStore.createIndex('achievementId', 'achievementId', { unique: false })
          }
          if (!db.objectStoreNames.contains('drawings')) {
            db.createObjectStore('drawings', { keyPath: 'id' })
          }
          if (!db.objectStoreNames.contains('stickers')) {
            const stickerStore = db.createObjectStore('stickers', { keyPath: 'id' })
            stickerStore.createIndex('stickerId', 'stickerId', { unique: false })
          }
          if (!db.objectStoreNames.contains('childrenProfiles')) {
            db.createObjectStore('childrenProfiles', { keyPath: 'id' })
          }
        }
      } catch (error) {
        logger.error('IndexedDB initialization error:', error)
        reject(error)
      }
    })

    return this.dbPromise
  }

  /**
   * Generic method to add or update data
   */
  /**
   * Add or update a record in the specified store
   * 
   * @param storeName - Name of the object store
   * @param data - Data to store (must include id field)
   * @throws {Error} If operation fails
   * 
   * @example
   * ```typescript
   * await jubeeDB.put('drawings', {
   *   id: 'drawing-123',
   *   imageData: 'data:image/png;base64,...',
   *   synced: false
   * });
   * ```
   */
  async put<K extends keyof DBSchema>(
    storeName: K,
    data: DBSchema[K]['value']
  ): Promise<void> {
    try {
      const db = await this.init()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)
        const request = store.put(data)

        request.onsuccess = () => resolve()
        request.onerror = () => reject(new Error(`Failed to put data in ${storeName}`))
      })
    } catch (error) {
      logger.error(`IndexedDB put error in ${storeName}:`, error)
      // Fallback to localStorage
      this.fallbackToLocalStorage('put', storeName, data)
    }
  }

  /**
   * Bulk insert/update records in a single transaction
   * Critical for sync batch operations and ACID compliance
   *
   * @param storeName - Name of the object store
   * @param items - Array of items to insert/update (must include id)
   * @throws {Error} If bulk operation fails
   *
   * @example
   * ```typescript
   * // Batch update after sync
   * await jubeeDB.putBulk('stickers', [
   *   { id: '1', stickerId: 'star', unlockedAt: '2026-01-01', synced: true },
   *   { id: '2', stickerId: 'heart', unlockedAt: '2026-01-02', synced: true }
   * ]);
   * ```
   */
  async putBulk<K extends keyof DBSchema>(
    storeName: K,
    items: DBSchema[K]['value'][]
  ): Promise<void> {
    if (items.length === 0) return

    try {
      const db = await this.init()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)

        items.forEach(item => {
          store.put(item)
        })

        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(
          new Error(`Bulk put failed in ${storeName}: ${transaction.error?.message}`)
        )
      })
    } catch (error) {
      logger.error(`IndexedDB putBulk error in ${storeName}:`, error)
      // Fallback to individual localStorage operations
      items.forEach(item => {
        this.fallbackToLocalStorage('put', storeName, item)
      })
    }
  }

  /**
   * Generic method to get data by key
   */
  /**
   * Retrieve a single record by key
   * 
   * @param storeName - Name of the object store
   * @param key - Record identifier
   * @returns Record data or undefined if not found
   * 
   * @example
   * ```typescript
   * const drawing = await jubeeDB.get('drawings', 'drawing-123');
   * if (drawing) {
   *   console.log('Found drawing:', drawing.title);
   * }
   * ```
   */
  async get<K extends keyof DBSchema>(
    storeName: K,
    key: string
  ): Promise<DBSchema[K]['value'] | undefined> {
    try {
      const db = await this.init()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly')
        const store = transaction.objectStore(storeName)
        const request = store.get(key)

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(new Error(`Failed to get data from ${storeName}`))
      })
    } catch (error) {
      logger.error(`IndexedDB get error in ${storeName}:`, error)
      // Fallback to localStorage
      return this.fallbackToLocalStorage('get', storeName, key) as DBSchema[K]['value'] | undefined
    }
  }

  /**
   * Generic method to get all data from a store
   */
  /**
   * Retrieve all records from a store
   * 
   * @param storeName - Name of the object store
   * @returns Array of all records in the store
   * 
   * @example
   * ```typescript
   * const allDrawings = await jubeeDB.getAll('drawings');
   * console.log(`Found ${allDrawings.length} drawings`);
   * ```
   */
  async getAll<K extends keyof DBSchema>(
    storeName: K
  ): Promise<DBSchema[K]['value'][]> {
    try {
      const db = await this.init()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly')
        const store = transaction.objectStore(storeName)
        const request = store.getAll()

        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => reject(new Error(`Failed to get all data from ${storeName}`))
      })
    } catch (error) {
      logger.error(`IndexedDB getAll error in ${storeName}:`, error)
      // Fallback to localStorage
      return this.fallbackToLocalStorage('getAll', storeName) as DBSchema[K]['value'][]
    }
  }

  /**
   * Generic method to delete data
   */
  /**
   * Delete a record from the store
   * 
   * @param storeName - Name of the object store
   * @param key - Record identifier to delete
   * @throws {Error} If deletion fails
   * 
   * @example
   * ```typescript
   * await jubeeDB.delete('drawings', 'drawing-123');
   * ```
   */
  async delete<K extends keyof DBSchema>(
    storeName: K,
    key: string
  ): Promise<void> {
    try {
      const db = await this.init()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)
        const request = store.delete(key)

        request.onsuccess = () => resolve()
        request.onerror = () => reject(new Error(`Failed to delete data from ${storeName}`))
      })
    } catch (error) {
      logger.error(`IndexedDB delete error in ${storeName}:`, error)
      // Fallback to localStorage
      this.fallbackToLocalStorage('delete', storeName, key)
    }
  }

  /**
   * Get unsynced records
   */
  /**
   * Get all records that haven't been synced to Supabase
   * Filters by synced === false
   * 
   * @param storeName - Name of the object store
   * @returns Array of unsynced records
   * 
   * @example
   * ```typescript
   * const unsyncedDrawings = await jubeeDB.getUnsynced('drawings');
   * if (unsyncedDrawings.length > 0) {
   *   console.log(`${unsyncedDrawings.length} drawings need syncing`);
   * }
   * ```
   */
  async getUnsynced<K extends keyof DBSchema>(
    storeName: K
  ): Promise<DBSchema[K]['value'][]> {
    try {
      const all = await this.getAll(storeName)
      return all.filter((item: DBSchema[K]['value']) => !item.synced)
    } catch (error) {
      logger.error(`IndexedDB getUnsynced error in ${storeName}:`, error)
      return []
    }
  }

  /**
   * Clear all data from a store
   */
  /**
   * Clear all records from a store
   * Use with caution - this is destructive
   * 
   * @param storeName - Name of the object store to clear
   * @throws {Error} If clear operation fails
   * 
   * @example
   * ```typescript
   * await jubeeDB.clear('drawings'); // Removes all drawings
   * ```
   */
  async clear<K extends keyof DBSchema>(storeName: K): Promise<void> {
    try {
      const db = await this.init()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)
        const request = store.clear()

        request.onsuccess = () => resolve()
        request.onerror = () => reject(new Error(`Failed to clear ${storeName}`))
      })
    } catch (error) {
      logger.error(`IndexedDB clear error in ${storeName}:`, error)
      throw error
    }
  }

  /**
   * Fallback to localStorage when IndexedDB fails
   * Provides basic CRUD operations using localStorage
   * 
   * @private
   * @param operation - Type of operation (put, get, getAll, delete)
   * @param storeName - Name of the store
   * @param data - Data for the operation
   * @returns Result of the operation
   */
  private fallbackToLocalStorage(
    operation: string,
    storeName: string,
    data?: unknown
  ): unknown {
    const key = `${DB_NAME}_${storeName}`
    
    interface ItemWithId {
      id: string
      [key: string]: unknown
    }
    
    try {
      switch (operation) {
        case 'put': {
          const existing = JSON.parse(localStorage.getItem(key) || '[]') as ItemWithId[]
          const putData = data as ItemWithId
          const index = existing.findIndex((item: ItemWithId) => item.id === putData.id)
          if (index >= 0) {
            existing[index] = putData
          } else {
            existing.push(putData)
          }
          localStorage.setItem(key, JSON.stringify(existing))
          break
        }
        case 'get': {
          const items = JSON.parse(localStorage.getItem(key) || '[]') as ItemWithId[]
          const id = data as string
          return items.find((item: ItemWithId) => item.id === id)
        }
        case 'getAll': {
          return JSON.parse(localStorage.getItem(key) || '[]')
        }
        case 'delete': {
          const items = JSON.parse(localStorage.getItem(key) || '[]') as ItemWithId[]
          const id = data as string
          const filtered = items.filter((item: ItemWithId) => item.id !== id)
          localStorage.setItem(key, JSON.stringify(filtered))
          break
        }
      }
    } catch (error) {
      logger.error('localStorage fallback error:', error)
      return operation === 'get' || operation === 'getAll' ? [] : undefined
    }
  }
}

/**
 * Singleton instance of IndexedDBService
 * Import and use this throughout the application
 * 
 * @example
 * ```typescript
 * import { jubeeDB } from '@/lib/indexedDB';
 * 
 * // Save data
 * await jubeeDB.put('drawings', drawingData);
 * 
 * // Retrieve data
 * const drawings = await jubeeDB.getAll('drawings');
 * ```
 */
export const jubeeDB = new IndexedDBService()
