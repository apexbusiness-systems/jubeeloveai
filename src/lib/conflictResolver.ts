/**
 * Conflict Resolution Manager
 * 
 * Detects and manages data conflicts between local and server data
 */

export interface DataConflict {
  id: string
  storeName: string
  field: string
  localValue: unknown
  serverValue: unknown
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
  localData: Record<string, unknown>
  serverData: Record<string, unknown>
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
    localData: Record<string, unknown>,
    serverData: Record<string, unknown>,
    recordName?: string
  ): ConflictGroup | null {
    const conflicts: DataConflict[] = []
    const conflictId = `${storeName}-${recordId}-${Date.now()}`

    // Skip if data is identical
    if (JSON.stringify(localData) === JSON.stringify(serverData)) {
      return null
    }

    // Compare timestamps
    const localTimestamp = String(localData.updatedAt || localData.updated_at || localData.createdAt || localData.created_at || '')
    const serverTimestamp = String(serverData.updated_at || serverData.created_at || '')

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
          localTimestamp: localTimestamp as string,
          serverTimestamp: serverTimestamp as string,
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
  resolveConflict(conflictId: string, choice: ResolutionChoice): Record<string, unknown> {
    const conflict = this.conflicts.find(c => c.id === conflictId)
    if (!conflict) {
      throw new Error('Conflict not found')
    }

    const resolvedData = this.resolveConflictData(conflict, choice)

    // Remove from conflicts
    this.conflicts = this.conflicts.filter(c => c.id !== conflictId)
    this.notifyListeners()
    this.saveConflicts()

    return resolvedData
  }

  /**
   * Resolve multiple conflicts with the same choice
   */
  async resolveBatch(conflictIds: string[], choice: ResolutionChoice): Promise<Record<string, unknown>[]> {
    const resolvedDataArray: Record<string, unknown>[] = []
    const errors: Array<{ id: string; error: string }> = []

    // Process in chunks to avoid blocking
    const chunkSize = 10
    for (let i = 0; i < conflictIds.length; i += chunkSize) {
      const chunk = conflictIds.slice(i, i + chunkSize)
      
      // Process chunk
      for (const conflictId of chunk) {
        try {
          const conflict = this.conflicts.find(c => c.id === conflictId)
          if (!conflict) {
            errors.push({ id: conflictId, error: 'Conflict not found' })
            continue
          }

          const resolvedData = this.resolveConflictData(conflict, choice)
          resolvedDataArray.push(resolvedData)
        } catch (error) {
          errors.push({ 
            id: conflictId, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })
        }
      }

      // Remove resolved conflicts
      this.conflicts = this.conflicts.filter(c => !conflictIds.includes(c.id))
      
      // Allow UI to breathe between chunks
      if (i + chunkSize < conflictIds.length) {
        await new Promise(resolve => setTimeout(resolve, 0))
      }
    }

    this.notifyListeners()
    this.saveConflicts()

    if (errors.length > 0) {
      console.warn('Batch resolution errors:', errors)
    }

    return resolvedDataArray
  }

  /**
   * Resolve all conflicts with the same choice
   */
  async resolveAll(choice: ResolutionChoice): Promise<Record<string, unknown>[]> {
    const allIds = this.conflicts.map(c => c.id)
    return this.resolveBatch(allIds, choice)
  }

  /**
   * Resolve conflicts by store with the same choice
   */
  async resolveByStore(storeName: string, choice: ResolutionChoice): Promise<Record<string, unknown>[]> {
    const storeConflictIds = this.conflicts
      .filter(c => c.storeName === storeName)
      .map(c => c.id)
    return this.resolveBatch(storeConflictIds, choice)
  }

  /**
   * Helper to resolve conflict data based on choice
   */
  private resolveConflictData(conflict: ConflictGroup, choice: ResolutionChoice): Record<string, unknown> {
    let resolvedData: Record<string, unknown>

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

    return resolvedData
  }

  /**
   * Automated diagnosis: recommend resolution strategy
   */
  diagnoseConflict(conflictId: string): ResolutionChoice {
    const conflict = this.conflicts.find(c => c.id === conflictId)
    if (!conflict) {
      return 'merge'
    }

    return this.diagnoseConflictGroup(conflict)
  }

  /**
   * Diagnose a conflict group and recommend strategy
   */
  private diagnoseConflictGroup(conflict: ConflictGroup): ResolutionChoice {
    let localNewer = 0
    let serverNewer = 0
    let equal = 0

    for (const fieldConflict of conflict.conflicts) {
      const localTime = new Date(fieldConflict.localTimestamp).getTime()
      const serverTime = new Date(fieldConflict.serverTimestamp).getTime()

      if (localTime > serverTime) {
        localNewer++
      } else if (serverTime > localTime) {
        serverNewer++
      } else {
        equal++
      }
    }

    // If most fields are newer locally, suggest local
    if (localNewer > serverNewer && localNewer > equal) {
      return 'local'
    }

    // If most fields are newer on server, suggest server
    if (serverNewer > localNewer && serverNewer > equal) {
      return 'server'
    }

    // Default to merge for mixed or equal timestamps
    return 'merge'
  }

  /**
   * Get diagnosis for all conflicts
   */
  getDiagnosis(): Record<string, ResolutionChoice> {
    const diagnosis: Record<string, ResolutionChoice> = {}
    
    for (const conflict of this.conflicts) {
      diagnosis[conflict.id] = this.diagnoseConflictGroup(conflict)
    }

    return diagnosis
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
