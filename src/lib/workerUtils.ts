/**
 * Web Worker Utility Functions
 * 
 * Helper functions for managing Web Workers across the application.
 */

/**
 * Check if Web Workers are supported in the current environment
 */
export function isWorkerSupported(): boolean {
  return typeof Worker !== 'undefined'
}

/**
 * Create a worker with error handling
 */
export function createWorker(workerPath: string): Worker | null {
  if (!isWorkerSupported()) {
    console.warn('[WorkerUtils] Web Workers not supported in this environment')
    return null
  }

  try {
    const worker = new Worker(workerPath, { type: 'module' })
    console.log('[WorkerUtils] Worker created successfully:', workerPath)
    return worker
  } catch (error) {
    console.error('[WorkerUtils] Failed to create worker:', error)
    return null
  }
}

/**
 * Safely terminate a worker
 */
export function terminateWorker(worker: Worker | null): void {
  if (worker) {
    try {
      worker.terminate()
      console.log('[WorkerUtils] Worker terminated successfully')
    } catch (error) {
      console.error('[WorkerUtils] Error terminating worker:', error)
    }
  }
}

/**
 * Post message to worker with error handling
 */
export function postToWorker<T>(
  worker: Worker | null,
  message: T
): boolean {
  if (!worker) {
    console.warn('[WorkerUtils] Cannot post to null worker')
    return false
  }

  try {
    worker.postMessage(message)
    return true
  } catch (error) {
    console.error('[WorkerUtils] Error posting message to worker:', error)
    return false
  }
}

/**
 * Create a promise-based wrapper for worker communication
 */
export function createWorkerPromise<TInput, TOutput>(
  worker: Worker,
  input: TInput,
  timeout: number = 5000
): Promise<TOutput> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Worker timeout'))
    }, timeout)

    const handler = (event: MessageEvent<TOutput>) => {
      clearTimeout(timeoutId)
      worker.removeEventListener('message', handler)
      resolve(event.data)
    }

    const errorHandler = (error: ErrorEvent) => {
      clearTimeout(timeoutId)
      worker.removeEventListener('error', errorHandler)
      reject(new Error(error.message))
    }

    worker.addEventListener('message', handler)
    worker.addEventListener('error', errorHandler)

    worker.postMessage(input)
  })
}
