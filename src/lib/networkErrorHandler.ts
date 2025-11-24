/**
 * Network Error Handler
 * Provides resilient network request handling with retries and fallbacks
 */

import { errorHandler } from './errorHandler';
import { logger } from './logger';

export interface NetworkRequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Make a network request with automatic retry and timeout handling
 */
export async function resilientFetch<T = any>(
  options: NetworkRequestOptions
): Promise<T> {
  const {
    url,
    method = 'GET',
    body,
    headers = {},
    timeout = 30000,
    retries = 3,
    onRetry,
  } = options;

  const makeRequest = async (): Promise<T> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(
          `HTTP ${response.status}: ${response.statusText} - ${errorText}`
        );
      }

      // Handle empty responses
      const text = await response.text();
      if (!text) {
        return null as T;
      }

      try {
        return JSON.parse(text);
      } catch {
        return text as T;
      }
    } catch (error) {
      clearTimeout(timeoutId);

      // Enhance error with context
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeout}ms: ${url}`);
        }
        if (error.message.includes('Failed to fetch')) {
          throw new Error(`Network error: Unable to reach ${url}. Check your connection.`);
        }
      }

      throw error;
    }
  };

  return errorHandler.withRetry(makeRequest, {
    maxRetries: retries,
    exponentialBackoff: true,
    onRetry,
  });
}

/**
 * Validate network response structure
 */
export function validateResponse<T>(
  response: unknown,
  validator: (data: unknown) => data is T
): T {
  if (!validator(response)) {
    logger.error('[Network] Invalid response structure:', response);
    throw new Error('Invalid response structure from server');
  }
  return response;
}

/**
 * Check if error is network-related
 */
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  return (
    error.message.includes('NetworkError') ||
    error.message.includes('Failed to fetch') ||
    error.message.includes('timeout') ||
    error.message.includes('Network error') ||
    error.name === 'AbortError'
  );
}

/**
 * Get user-friendly error message for network errors
 */
export function getNetworkErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'An unexpected error occurred. Please try again.';
  }

  if (error.message.includes('timeout')) {
    return 'Request timed out. Please check your connection and try again.';
  }

  if (error.message.includes('Failed to fetch') || error.message.includes('Network error')) {
    return 'Unable to connect. Please check your internet connection.';
  }

  if (error.message.includes('HTTP 404')) {
    return 'The requested resource was not found.';
  }

  if (error.message.includes('HTTP 401') || error.message.includes('HTTP 403')) {
    return 'Authentication failed. Please log in again.';
  }

  if (error.message.includes('HTTP 500') || error.message.includes('HTTP 502') || error.message.includes('HTTP 503')) {
    return 'Server error. Please try again later.';
  }

  return 'An error occurred. Please try again.';
}
