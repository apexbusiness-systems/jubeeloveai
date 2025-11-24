/**
 * Edge Function Error Handler
 * Provides resilient error handling for Supabase Edge Function calls
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';
import { errorHandler } from './errorHandler';
import { isNetworkError, getNetworkErrorMessage } from './networkErrorHandler';

export interface EdgeFunctionOptions {
  functionName: string;
  body?: Record<string, any>;
  retries?: number;
  timeout?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Call an edge function with automatic retry and error handling
 */
export async function callEdgeFunction<T = any>(
  options: EdgeFunctionOptions
): Promise<T> {
  const {
    functionName,
    body,
    retries = 2,
    timeout = 30000,
    onRetry,
  } = options;

  const makeRequest = async (): Promise<T> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      logger.dev(`[Edge Function] Calling ${functionName}`, body);

      const { data, error } = await supabase.functions.invoke(functionName, {
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (error) {
        logger.error(`[Edge Function] Error from ${functionName}:`, error);
        throw new Error(error.message || 'Edge function error');
      }

      logger.dev(`[Edge Function] Success from ${functionName}`, data);
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      // Enhance error with context
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Edge function '${functionName}' timed out after ${timeout}ms`);
        }
      }

      throw error;
    }
  };

  try {
    return await errorHandler.withRetry(makeRequest, {
      maxRetries: retries,
      exponentialBackoff: true,
      onRetry: (attempt, error) => {
        logger.warn(`[Edge Function] Retry ${attempt} for ${functionName}:`, error);
        if (onRetry) {
          onRetry(attempt, error);
        }
      },
    });
  } catch (error) {
    logger.error(`[Edge Function] Failed after retries for ${functionName}:`, error);

    // Provide user-friendly error message
    if (isNetworkError(error)) {
      throw new Error(getNetworkErrorMessage(error));
    }

    if (error instanceof Error) {
      throw new Error(`Unable to complete action: ${error.message}`);
    }

    throw new Error('An unexpected error occurred. Please try again.');
  }
}

/**
 * Validate edge function response
 */
export function validateEdgeFunctionResponse<T>(
  data: unknown,
  validator: (data: unknown) => data is T,
  functionName: string
): T {
  if (!validator(data)) {
    logger.error(`[Edge Function] Invalid response from ${functionName}:`, data);
    throw new Error(`Invalid response from ${functionName}`);
  }
  return data;
}
