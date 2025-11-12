/**
 * Comprehensive Error Handler with Retry Logic
 * Provides graceful degradation and user-friendly error messages
 */

interface RetryOptions {
  maxRetries?: number
  delayMs?: number
  exponentialBackoff?: boolean
  onRetry?: (attempt: number, error: Error) => void
}

interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  timestamp: string
  userAgent: string
}

class ErrorHandler {
  /**
   * Execute a function with automatic retry logic
   */
  async withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      delayMs = 1000,
      exponentialBackoff = true,
      onRetry,
    } = options

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        if (attempt < maxRetries) {
          const delay = exponentialBackoff 
            ? delayMs * Math.pow(2, attempt)
            : delayMs

          console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`)
          
          if (onRetry) {
            onRetry(attempt + 1, lastError)
          }

          await this.sleep(delay)
        }
      }
    }

    throw lastError
  }

  /**
   * Execute with timeout
   */
  async withTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    timeoutError?: string
  ): Promise<T> {
    return Promise.race([
      fn(),
      this.sleep(timeoutMs).then(() => {
        throw new Error(timeoutError || `Operation timed out after ${timeoutMs}ms`)
      })
    ])
  }

  /**
   * Execute with fallback
   */
  async withFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T> | T,
    onFallback?: (error: Error) => void
  ): Promise<T> {
    try {
      return await primary()
    } catch (error) {
      console.warn('Primary operation failed, using fallback:', error)
      
      if (onFallback && error instanceof Error) {
        onFallback(error)
      }

      return await fallback()
    }
  }

  /**
   * Batch operations with error tolerance
   */
  async batch<T, R>(
    items: T[],
    operation: (item: T) => Promise<R>,
    options: {
      concurrency?: number
      continueOnError?: boolean
      onError?: (item: T, error: Error) => void
    } = {}
  ): Promise<Array<{ success: boolean; result?: R; error?: Error; item: T }>> {
    const {
      concurrency = 5,
      continueOnError = true,
      onError,
    } = options

    const results: Array<{ success: boolean; result?: R; error?: Error; item: T }> = []
    const queue = [...items]

    const processItem = async (item: T) => {
      try {
        const result = await operation(item)
        return { success: true, result, item }
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error')
        
        if (onError) {
          onError(item, err)
        }

        if (!continueOnError) {
          throw err
        }

        return { success: false, error: err, item }
      }
    }

    // Process items with concurrency limit
    const workers: Promise<void>[] = []
    for (let i = 0; i < Math.min(concurrency, queue.length); i++) {
      workers.push((async () => {
        while (queue.length > 0) {
          const item = queue.shift()
          if (item) {
            const result = await processItem(item)
            results.push(result)
          }
        }
      })())
    }

    await Promise.all(workers)
    return results
  }

  /**
   * Log error with context
   */
  logError(error: Error, context?: Partial<ErrorContext>): void {
    const errorLog = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      },
    }

    console.error('Error logged:', errorLog)

    // In production, send to error tracking service
    if (typeof window !== 'undefined' && import.meta.env.PROD) {
      // TODO: Send to error tracking service (e.g., Sentry, LogRocket)
      this.sendToErrorTracking(errorLog)
    }
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(error: Error): string {
    const errorMessages: Record<string, string> = {
      // Network errors
      'NetworkError': 'Unable to connect. Please check your internet connection.',
      'TypeError': 'Something went wrong. Please try again.',
      
      // Supabase errors
      'AuthSessionMissingError': 'Please log in to continue.',
      'PostgrestError': 'Database error. Please try again later.',
      
      // Custom errors
      'RATE_LIMIT': 'Too many requests. Please wait a moment and try again.',
      'TIMEOUT': 'The request took too long. Please try again.',
      'VALIDATION_ERROR': 'Please check your input and try again.',
    }

    return errorMessages[error.name] || errorMessages[error.message] || 
      'An unexpected error occurred. Please try again.'
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: Error): boolean {
    const retryableErrors = [
      'NetworkError',
      'TimeoutError',
      'RATE_LIMIT',
      'TIMEOUT',
    ]

    return retryableErrors.includes(error.name) || 
      retryableErrors.includes(error.message) ||
      error.message.includes('network') ||
      error.message.includes('timeout')
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Send error to tracking service
   */
  private async sendToErrorTracking(errorLog: any): Promise<void> {
    try {
      // Implement error tracking service integration here
      // Example: Sentry, LogRocket, or custom endpoint
      console.log('Would send to error tracking:', errorLog)
    } catch (error) {
      console.error('Failed to send error to tracking service:', error)
    }
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler()

/**
 * Error boundary fallback component data
 */
export const ERROR_MESSAGES = {
  generic: {
    title: 'Oops! Something went wrong',
    description: 'Don\'t worry, Jubee is working to fix it!',
    action: 'Try Again',
  },
  network: {
    title: 'Connection Lost',
    description: 'Please check your internet connection and try again.',
    action: 'Retry',
  },
  auth: {
    title: 'Session Expired',
    description: 'Please log in again to continue.',
    action: 'Log In',
  },
  notFound: {
    title: 'Page Not Found',
    description: 'The page you\'re looking for doesn\'t exist.',
    action: 'Go Home',
  },
}
