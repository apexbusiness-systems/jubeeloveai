/**
 * Supabase Error Handler
 * Provides enhanced error handling for Supabase operations
 */

import { PostgrestError } from '@supabase/supabase-js';
import { logger } from './logger';
import { captureException } from './sentry';

export interface SupabaseErrorContext {
  table?: string;
  operation?: 'select' | 'insert' | 'update' | 'delete' | 'rpc';
  userId?: string;
}

/**
 * Handle Supabase errors with context
 */
export function handleSupabaseError(
  error: PostgrestError | Error | null,
  context?: SupabaseErrorContext
): never {
  if (!error) {
    throw new Error('Unknown database error occurred');
  }

  const errorMessage = 'message' in error ? error.message : String(error);

  // Log error with context
  logger.error('[Supabase Error]', {
    message: errorMessage,
    ...context,
  });

  // Report to Sentry
  const errorToReport = error instanceof Error ? error : new Error(errorMessage);
  captureException(errorToReport, {
    supabase: true,
    ...context,
  });

  // Throw user-friendly error
  throw new Error(getUserFriendlySupabaseError(error, context));
}

/**
 * Get user-friendly error message for Supabase errors
 */
function getUserFriendlySupabaseError(
  error: PostgrestError | Error,
  context?: SupabaseErrorContext
): string {
  const message = error.message.toLowerCase();

  // RLS policy violations
  if (message.includes('row-level security') || message.includes('policy')) {
    if (context?.operation === 'select') {
      return 'You do not have permission to view this data.';
    }
    if (context?.operation === 'insert') {
      return 'You do not have permission to create this item.';
    }
    if (context?.operation === 'update') {
      return 'You do not have permission to update this item.';
    }
    if (context?.operation === 'delete') {
      return 'You do not have permission to delete this item.';
    }
    return 'You do not have permission to perform this action.';
  }

  // Foreign key violations
  if (message.includes('foreign key') || message.includes('violates')) {
    return 'This action cannot be completed due to related data. Please check dependencies.';
  }

  // Unique constraint violations
  if (message.includes('unique') || message.includes('duplicate')) {
    return 'This item already exists. Please use a different value.';
  }

  // Not null violations
  if (message.includes('not-null') || message.includes('null value')) {
    return 'Required information is missing. Please fill in all required fields.';
  }

  // Connection errors
  if (message.includes('connection') || message.includes('timeout')) {
    return 'Unable to connect to the database. Please check your connection and try again.';
  }

  // JWT/Auth errors
  if (message.includes('jwt') || message.includes('token')) {
    return 'Your session has expired. Please log in again.';
  }

  // Generic fallback
  return 'A database error occurred. Please try again.';
}

/**
 * Validate Supabase response
 */
export function validateSupabaseResponse<T>(
  data: T | null,
  error: PostgrestError | null,
  context?: SupabaseErrorContext
): T {
  if (error) {
    handleSupabaseError(error, context);
  }

  if (data === null) {
    logger.warn('[Supabase] No data returned', context);
  }

  return data as T;
}

/**
 * Check if error is a Supabase RLS error
 */
export function isRLSError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  const message = error.message.toLowerCase();
  return message.includes('row-level security') || message.includes('policy');
}

/**
 * Check if error is a Supabase auth error
 */
export function isAuthError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  const message = error.message.toLowerCase();
  return message.includes('jwt') || 
         message.includes('token') || 
         message.includes('authentication') ||
         message.includes('unauthorized');
}
