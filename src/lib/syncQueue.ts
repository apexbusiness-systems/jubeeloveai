/**
 * Sync Queue Manager
 * 
 * Manages a persistent queue of failed sync operations for automatic retry
 * when connection is restored.
 */

import { jubeeDB } from './indexedDB'

export interface QueuedOperation {
  id: string
  storeName: string
  operation: 'sync' | 'pull'
  data: Record<string, unknown>
  attempts: number
  lastAttempt: Date
  error?: string
  priority: number
  createdAt: Date
}

class SyncQueue {
  private queue: QueuedOperation[] = []
  private isProcessing = false
  private readonly MAX_ATTEMPTS = 5
  private readonly RETRY_DELAY = 2000 // 2 seconds base delay

  constructor() {
    this.loadQueue()
  }

  /**
   * Load queue from localStorage
   */
  private loadQueue() {
    try {
      const stored = localStorage.getItem('jubee-sync-queue')
      if (stored) {
        this.queue = JSON.parse(stored, (key, value) => {
          if (key === 'lastAttempt' || key === 'createdAt') {
            return new Date(value)
          }
          return value
        })
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error)
      this.queue = []
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveQueue() {
    try {
      localStorage.setItem('jubee-sync-queue', JSON.stringify(this.queue))
    } catch (error) {
      console.error('Failed to save sync queue:', error)
    }
  }

  /**
   * Add operation to queue
   */
  add(operation: Omit<QueuedOperation, 'id' | 'attempts' | 'lastAttempt' | 'createdAt'>) {
    const queuedOp: QueuedOperation = {
      ...operation,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      attempts: 0,
      lastAttempt: new Date(),
      createdAt: new Date()
    }

    this.queue.push(queuedOp)
    this.sortQueue()
    this.saveQueue()
    
    console.log(`[SyncQueue] Added operation to queue:`, queuedOp.storeName)
  }

  /**
   * Sort queue by priority (higher first) and creation time (older first)
   */
  private sortQueue() {
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority
      }
      return a.createdAt.getTime() - b.createdAt.getTime()
    })
  }

  /**
   * Get all queued operations
   */
  getAll(): QueuedOperation[] {
    return [...this.queue]
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length
  }

  /**
   * Remove operation from queue
   */
  remove(id: string) {
    this.queue = this.queue.filter(op => op.id !== id)
    this.saveQueue()
  }

  /**
   * Clear all operations from queue
   */
  clear() {
    this.queue = []
    this.saveQueue()
  }

  /**
   * Process queue with retry logic
   */
  async processQueue(
    processor: (operation: QueuedOperation) => Promise<void>
  ): Promise<{ processed: number; failed: number; remaining: number }> {
    if (this.isProcessing) {
      console.log('[SyncQueue] Already processing')
      return { processed: 0, failed: 0, remaining: this.queue.length }
    }

    this.isProcessing = true
    let processed = 0
    let failed = 0

    try {
      const operations = [...this.queue]
      
      for (const operation of operations) {
        // Check if max attempts reached
        if (operation.attempts >= this.MAX_ATTEMPTS) {
          console.warn(`[SyncQueue] Max attempts reached for ${operation.storeName}, removing`)
          this.remove(operation.id)
          failed++
          continue
        }

        // Calculate exponential backoff delay
        const delay = this.RETRY_DELAY * Math.pow(2, operation.attempts)
        const timeSinceLastAttempt = Date.now() - operation.lastAttempt.getTime()

        // Skip if not enough time has passed
        if (timeSinceLastAttempt < delay) {
          continue
        }

        try {
          // Update attempt info
          operation.attempts++
          operation.lastAttempt = new Date()
          this.saveQueue()

          // Process operation
          await processor(operation)
          
          // Success - remove from queue
          this.remove(operation.id)
          processed++
          console.log(`[SyncQueue] Successfully processed ${operation.storeName}`)
        } catch (error) {
          console.error(`[SyncQueue] Failed to process ${operation.storeName}:`, error)
          operation.error = error instanceof Error ? error.message : 'Unknown error'
          this.saveQueue()
          failed++
        }

        // Small delay between operations to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } finally {
      this.isProcessing = false
    }

    return {
      processed,
      failed,
      remaining: this.queue.length
    }
  }

  /**
   * Get statistics about the queue
   */
  getStats() {
    const byStore: Record<string, number> = {}
    const byOperation: Record<string, number> = {}
    let totalAttempts = 0

    this.queue.forEach(op => {
      byStore[op.storeName] = (byStore[op.storeName] || 0) + 1
      byOperation[op.operation] = (byOperation[op.operation] || 0) + 1
      totalAttempts += op.attempts
    })

    return {
      total: this.queue.length,
      byStore,
      byOperation,
      avgAttempts: this.queue.length > 0 ? totalAttempts / this.queue.length : 0
    }
  }
}

export const syncQueue = new SyncQueue()
