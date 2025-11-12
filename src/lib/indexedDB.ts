/**
 * IndexedDB Service for Offline Storage
 * Provides persistent local storage with fallback to localStorage
 */

const DB_NAME = 'jubee-love-db'
const DB_VERSION = 1

interface DBSchema {
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
      settings: Record<string, any>
      updatedAt: string
      synced: boolean
    }
  }
}

class IndexedDBService {
  private db: IDBDatabase | null = null
  private dbPromise: Promise<IDBDatabase> | null = null
  private isSupported: boolean

  constructor() {
    this.isSupported = typeof indexedDB !== 'undefined'
  }

  /**
   * Initialize the database
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
          console.error('IndexedDB error:', request.error)
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
        console.error('IndexedDB initialization error:', error)
        reject(error)
      }
    })

    return this.dbPromise
  }

  /**
   * Generic method to add or update data
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
      console.error(`IndexedDB put error in ${storeName}:`, error)
      // Fallback to localStorage
      this.fallbackToLocalStorage('put', storeName, data)
    }
  }

  /**
   * Generic method to get data by key
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
      console.error(`IndexedDB get error in ${storeName}:`, error)
      // Fallback to localStorage
      return this.fallbackToLocalStorage('get', storeName, key)
    }
  }

  /**
   * Generic method to get all data from a store
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
      console.error(`IndexedDB getAll error in ${storeName}:`, error)
      // Fallback to localStorage
      return this.fallbackToLocalStorage('getAll', storeName)
    }
  }

  /**
   * Generic method to delete data
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
      console.error(`IndexedDB delete error in ${storeName}:`, error)
      // Fallback to localStorage
      this.fallbackToLocalStorage('delete', storeName, key)
    }
  }

  /**
   * Get unsynced records
   */
  async getUnsynced<K extends keyof DBSchema>(
    storeName: K
  ): Promise<DBSchema[K]['value'][]> {
    try {
      const all = await this.getAll(storeName)
      return all.filter((item: any) => !item.synced)
    } catch (error) {
      console.error(`IndexedDB getUnsynced error in ${storeName}:`, error)
      return []
    }
  }

  /**
   * Clear all data from a store
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
      console.error(`IndexedDB clear error in ${storeName}:`, error)
      throw error
    }
  }

  /**
   * Fallback to localStorage when IndexedDB fails
   */
  private fallbackToLocalStorage(
    operation: string,
    storeName: string,
    data?: any
  ): any {
    const key = `${DB_NAME}_${storeName}`
    
    try {
      switch (operation) {
        case 'put': {
          const existing = JSON.parse(localStorage.getItem(key) || '[]')
          const index = existing.findIndex((item: any) => item.id === data.id)
          if (index >= 0) {
            existing[index] = data
          } else {
            existing.push(data)
          }
          localStorage.setItem(key, JSON.stringify(existing))
          break
        }
        case 'get': {
          const items = JSON.parse(localStorage.getItem(key) || '[]')
          return items.find((item: any) => item.id === data)
        }
        case 'getAll': {
          return JSON.parse(localStorage.getItem(key) || '[]')
        }
        case 'delete': {
          const items = JSON.parse(localStorage.getItem(key) || '[]')
          const filtered = items.filter((item: any) => item.id !== data)
          localStorage.setItem(key, JSON.stringify(filtered))
          break
        }
      }
    } catch (error) {
      console.error('localStorage fallback error:', error)
      return operation === 'get' || operation === 'getAll' ? [] : undefined
    }
  }
}

// Export singleton instance
export const jubeeDB = new IndexedDBService()
