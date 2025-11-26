/**
 * Enhanced Offline Queue
 * 
 * Manages queued operations with priority, retry logic,
 * and background sync support for offline reliability.
 */

import { logger } from './logger';

interface QueuedOperation {
  id: string;
  type: 'sync' | 'upload' | 'delete' | 'update';
  storeName: string;
  data: any;
  priority: number; // 1-10, higher = more important
  timestamp: number;
  retries: number;
  maxRetries: number;
  lastError?: string;
}

const MAX_QUEUE_SIZE = 1000;
const STORAGE_KEY = 'jubee_offline_queue';
const MAX_RETRIES = 5;
const RETRY_DELAYS = [1000, 2000, 5000, 10000, 30000]; // Exponential backoff

class OfflineQueue {
  private queue: QueuedOperation[] = [];
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.loadQueue();
    this.startProcessing();
  }

  /**
   * Load queue from localStorage
   */
  private loadQueue() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        logger.info(`[Offline Queue] Loaded ${this.queue.length} operations`);
      }
    } catch (error) {
      logger.error('[Offline Queue] Failed to load queue', error);
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveQueue() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      logger.error('[Offline Queue] Failed to save queue', error);
    }
  }

  /**
   * Add operation to queue
   */
  add(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retries'>): boolean {
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      logger.error('[Offline Queue] Queue full, cannot add operation');
      return false;
    }

    const queuedOp: QueuedOperation = {
      ...operation,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(queuedOp);
    this.queue.sort((a, b) => b.priority - a.priority); // Sort by priority
    this.saveQueue();

    logger.info('[Offline Queue] Operation queued', {
      id: queuedOp.id,
      type: queuedOp.type,
      priority: queuedOp.priority,
    });

    return true;
  }

  /**
   * Remove operation from queue
   */
  private remove(id: string) {
    this.queue = this.queue.filter(op => op.id !== id);
    this.saveQueue();
  }

  /**
   * Mark operation as failed
   */
  private markFailed(id: string, error: string) {
    const op = this.queue.find(o => o.id === id);
    if (op) {
      op.retries++;
      op.lastError = error;

      if (op.retries >= op.maxRetries) {
        logger.error('[Offline Queue] Operation max retries reached, removing', {
          id: op.id,
          type: op.type,
          retries: op.retries,
        });
        this.remove(id);
      } else {
        logger.warn('[Offline Queue] Operation failed, will retry', {
          id: op.id,
          retries: op.retries,
          maxRetries: op.maxRetries,
        });
        this.saveQueue();
      }
    }
  }

  /**
   * Process queue with exponential backoff
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || !navigator.onLine) return;

    this.isProcessing = true;

    try {
      const operations = [...this.queue];
      
      for (const op of operations) {
        // Check if retry delay has elapsed
        const retryDelay = RETRY_DELAYS[Math.min(op.retries, RETRY_DELAYS.length - 1)];
        const timeSinceLastAttempt = Date.now() - op.timestamp;
        
        if (op.retries > 0 && timeSinceLastAttempt < retryDelay) {
          continue; // Skip, not ready for retry yet
        }

        try {
          await this.executeOperation(op);
          this.remove(op.id);
          logger.info('[Offline Queue] Operation completed', {
            id: op.id,
            type: op.type,
          });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          this.markFailed(op.id, errorMsg);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute a queued operation
   */
  private async executeOperation(op: QueuedOperation): Promise<void> {
    // This will be implemented based on the operation type
    // For now, just simulate processing
    logger.info('[Offline Queue] Executing operation', {
      id: op.id,
      type: op.type,
      storeName: op.storeName,
    });

    // Actual execution will be handled by sync service
    // This is a placeholder for the queue management logic
  }

  /**
   * Start automatic queue processing
   */
  private startProcessing() {
    // Process immediately on online event
    window.addEventListener('online', () => {
      logger.info('[Offline Queue] Back online, processing queue');
      this.processQueue();
    });

    // Process periodically when online
    this.processingInterval = setInterval(() => {
      if (navigator.onLine && this.queue.length > 0) {
        this.processQueue();
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop processing
   */
  stop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      total: this.queue.length,
      byType: this.queue.reduce((acc, op) => {
        acc[op.type] = (acc[op.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byPriority: this.queue.reduce((acc, op) => {
        acc[op.priority] = (acc[op.priority] || 0) + 1;
        return acc;
      }, {} as Record<number, number>),
      failed: this.queue.filter(op => op.retries > 0).length,
    };
  }

  /**
   * Clear all operations
   */
  clear() {
    this.queue = [];
    this.saveQueue();
    logger.info('[Offline Queue] Queue cleared');
  }
}

// Singleton instance
export const offlineQueue = new OfflineQueue();
