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
  body?: Record<string, unknown>;
  retries?: number;
  timeout?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

interface EdgeFunctionErrorLike {
  message?: string;
  context?: unknown;
  status?: number;
  cause?: unknown;
}

interface ResponseLike {
  status?: number;
  clone?: () => ResponseLike;
  json?: () => Promise<unknown>;
}

function isResponseLike(value: unknown): value is ResponseLike {
  return typeof value === 'object' && value !== null;
}

function getStatusCode(error: unknown): number | null {
  const directStatus = (error as EdgeFunctionErrorLike)?.status;
  if (typeof directStatus === 'number') return directStatus;

  const context = (error as EdgeFunctionErrorLike)?.context;
  if (isResponseLike(context) && typeof context.status === 'number') {
    return context.status;
  }

  return null;
}

function hasTtsFallbackMessage(error: unknown): boolean {
  const message = ((error as EdgeFunctionErrorLike)?.message ?? '').toLowerCase();
  return (
    message.includes('all_tts_unavailable') ||
    message.includes('"fallback":"browser"') ||
    message.includes('status code 503') ||
    message.includes('returned 503')
  );
}

async function isExpectedTtsFallback(functionName: string, error: unknown): Promise<boolean> {
  if (functionName !== 'text-to-speech') return false;

  if (hasTtsFallbackMessage(error)) return true;

  const status = getStatusCode(error);
  if (status !== 503) return false;

  const maybeResponse = (error as EdgeFunctionErrorLike)?.context;
  if (!isResponseLike(maybeResponse)) {
    // For text-to-speech, any 503 is expected fallback behavior.
    return true;
  }

  try {
    const clone = typeof maybeResponse.clone === 'function' ? maybeResponse.clone() : maybeResponse;
    const payload = typeof clone.json === 'function'
      ? await clone.json() as { error?: string; fallback?: string }
      : null;

    if (!payload) return true;

    return payload.error === 'ALL_TTS_UNAVAILABLE' || payload.fallback === 'browser';
  } catch {
    // If parsing fails but status is 503 for text-to-speech,
    // still treat as expected fallback behavior.
    return true;
  }
}

/**
 * Call an edge function with automatic retry and error handling
 */
export async function callEdgeFunction<T = unknown>(
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
        if (await isExpectedTtsFallback(functionName, error)) {
          logger.warn('[Edge Function] text-to-speech unavailable; using browser fallback.');
          return null as T;
        }

        logger.error(`[Edge Function] Error from ${functionName}:`, error);
        throw new Error((error as EdgeFunctionErrorLike).message || 'Edge function error');
      }

      logger.dev(`[Edge Function] Success from ${functionName}`, data);
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      // Enhance error with context
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Edge function '${functionName}' timed out after ${timeout}ms`);
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
    if (await isExpectedTtsFallback(functionName, error)) {
      logger.warn('[Edge Function] text-to-speech unavailable after retries; using browser fallback.');
      return null as T;
    }

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

