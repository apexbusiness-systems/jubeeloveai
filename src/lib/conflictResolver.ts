/**
 * Conflict Resolution Manager
 * 
 * Detects and manages data conflicts between local and server data
 */

export interface DataConflict {
  id: string
  storeName: string
  field: string
  localValue: any
  serverValue: any
  localTimestamp: string
  serverTimestamp: string
  recordId: string
}

export interface ConflictGroup {
  id: string
  storeName: string
  recordId: string
  recordName?: string
  conflicts: DataConflict[]
  localData: any
  serverData: any
  createdAt: Date
}

export type ResolutionChoice = 'local' | 'server' | 'merge'

class ConflictResolver {
  private conflicts: ConflictGroup[] = []
  private listeners: Array<(conflicts: ConflictGroup[]) => void> = []

  /**
   * Compare two data objects and detect conflicts
   */
  detectConflicts(
    storeName: string,
    recordId: string,
    localData: any,
    serverData: any,
    recordName?: string
  ): ConflictGroup | null {
    const conflicts: DataConflict[] = []
    const conflictId = `${storeName}-${recordId}-${Date.now()}`

    // Skip if data is identical
    if (JSON.stringify(localData) === JSON.stringify(serverData)) {
      return null
    }

    // Compare timestamps
    const localTimestamp = localData.updatedAt || localData.updated_at || localData.createdAt || localData.created_at
    const serverTimestamp = serverData.updated_at || serverData.created_at

    // If server is newer and local is synced, no conflict
    if (localData.synced && serverTimestamp > localTimestamp) {
      return null
    }

    // Compare each field
    const allKeys = new Set([
      ...Object.keys(localData),
      ...Object.keys(serverData)
    ])

    for (const key of allKeys) {
      // Skip internal fields
      if (['synced', 'id', 'user_id', 'child_profile_id'].includes(key)) {
        continue
      }

      const localValue = localData[key]
      const serverValue = serverData[key]

      // Check if values differ
      if (JSON.stringify(localValue) !== JSON.stringify(serverValue)) {
        conflicts.push({
          id: `${conflictId}-${key}`,
          storeName,
          field: key,
          localValue,
          serverValue,
          localTimestamp,
          serverTimestamp,
          recordId
        })
      }
    }

    if (conflicts.length === 0) {
      return null
    }

    return {
      id: conflictId,
      storeName,
      recordId,
      recordName,
      conflicts,
      localData,
      serverData,
      createdAt: new Date()
    }
  }

  /**
   * Add a conflict to the queue
   */
  addConflict(conflict: ConflictGroup) {
    this.conflicts.push(conflict)
    this.notifyListeners()
    this.saveConflicts()
  }

  /**
   * Get all pending conflicts
   */
  getConflicts(): ConflictGroup[] {
    return [...this.conflicts]
  }

  /**
   * Get conflicts for a specific store
   */
  getConflictsByStore(storeName: string): ConflictGroup[] {
    return this.conflicts.filter(c => c.storeName === storeName)
  }

  /**
   * Resolve a conflict
   */
  resolveConflict(conflictId: string, choice: ResolutionChoice): any {
    const conflict = this.conflicts.find(c => c.id === conflictId)
    if (!conflict) {
      throw new Error('Conflict not found')
    }

    let resolvedData: any

    switch (choice) {
      case 'local':
        resolvedData = { ...conflict.localData, synced: true }
        break
      
      case 'server':
        resolvedData = { ...conflict.serverData, synced: true }
        break
      
      case 'merge':
        // Merge strategy: prefer newer values based on timestamp
        resolvedData = { ...conflict.serverData }
        for (const fieldConflict of conflict.conflicts) {
          if (fieldConflict.localTimestamp > fieldConflict.serverTimestamp) {
            resolvedData[fieldConflict.field] = fieldConflict.localValue
          }
        }
        resolvedData.synced = true
        break
    }

    // Remove from conflicts
    this.conflicts = this.conflicts.filter(c => c.id !== conflictId)
    this.notifyListeners()
    this.saveConflicts()

    return resolvedData
  }

  /**
   * Remove a conflict without resolving
   */
  removeConflict(conflictId: string) {
    this.conflicts = this.conflicts.filter(c => c.id !== conflictId)
    this.notifyListeners()
    this.saveConflicts()
  }

  /**
   * Clear all conflicts
   */
  clearAll() {
    this.conflicts = []
    this.notifyListeners()
    this.saveConflicts()
  }

  /**
   * Subscribe to conflict changes
   */
  subscribe(listener: (conflicts: ConflictGroup[]) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  /**
   * Notify all listeners
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.conflicts))
  }

  /**
   * Save conflicts to localStorage
   */
  private saveConflicts() {
    try {
      localStorage.setItem('jubee-conflicts', JSON.stringify(this.conflicts))
    } catch (error) {
      console.error('Failed to save conflicts:', error)
    }
  }

  /**
   * Load conflicts from localStorage
   */
  loadConflicts() {
    try {
      const stored = localStorage.getItem('jubee-conflicts')
      if (stored) {
        this.conflicts = JSON.parse(stored, (key, value) => {
          if (key === 'createdAt') {
            return new Date(value)
          }
          return value
        })
        this.notifyListeners()
      }
    } catch (error) {
      console.error('Failed to load conflicts:', error)
      this.conflicts = []
    }
  }

  /**
   * Get conflict statistics
   */
  getStats() {
    const byStore: Record<string, number> = {}
    
    this.conflicts.forEach(conflict => {
      byStore[conflict.storeName] = (byStore[conflict.storeName] || 0) + 1
    })

    return {
      total: this.conflicts.length,
      byStore
    }
  }
}

export const conflictResolver = new ConflictResolver()

// Load conflicts on init
conflictResolver.loadConflicts()
