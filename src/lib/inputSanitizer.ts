/**
 * Input Sanitizer
 * Prevents XSS and injection attacks by sanitizing user input
 */

import { logger } from './logger';

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHTML(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Sanitize string input with configurable options
 */
export interface SanitizeOptions {
  maxLength?: number;
  allowedCharacters?: RegExp;
  trim?: boolean;
  lowercase?: boolean;
}

export function sanitizeString(
  input: string,
  options: SanitizeOptions = {}
): string {
  const {
    maxLength,
    allowedCharacters,
    trim = true,
    lowercase = false,
  } = options;

  let sanitized = input;

  // Trim whitespace
  if (trim) {
    sanitized = sanitized.trim();
  }

  // Convert to lowercase
  if (lowercase) {
    sanitized = sanitized.toLowerCase();
  }

  // Filter by allowed characters
  if (allowedCharacters) {
    sanitized = sanitized
      .split('')
      .filter(char => allowedCharacters.test(char))
      .join('');
  }

  // Truncate to max length
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
    logger.warn('[Input Sanitizer] Input truncated to max length:', maxLength);
  }

  return sanitized;
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  return sanitizeString(email, {
    trim: true,
    lowercase: true,
    maxLength: 255,
  });
}

/**
 * Sanitize username
 */
export function sanitizeUsername(username: string): string {
  return sanitizeString(username, {
    trim: true,
    maxLength: 50,
    allowedCharacters: /[a-zA-Z0-9_-]/,
  });
}

/**
 * Validate and sanitize URL
 */
export function sanitizeURL(url: string): string {
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      logger.warn('[Input Sanitizer] Invalid URL protocol:', parsed.protocol);
      throw new Error('Invalid URL protocol');
    }

    return parsed.toString();
  } catch (error) {
    logger.error('[Input Sanitizer] Invalid URL:', url, error);
    throw new Error('Invalid URL format');
  }
}

/**
 * Sanitize file name
 */
export function sanitizeFileName(fileName: string): string {
  return sanitizeString(fileName, {
    trim: true,
    maxLength: 255,
    allowedCharacters: /[a-zA-Z0-9._-]/,
  });
}

/**
 * Validate input is not empty
 */
export function validateNotEmpty(input: string, fieldName: string): void {
  if (!input || input.trim().length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }
}

/**
 * Validate input length
 */
export function validateLength(
  input: string,
  fieldName: string,
  min?: number,
  max?: number
): void {
  const length = input.length;

  if (min !== undefined && length < min) {
    throw new Error(`${fieldName} must be at least ${min} characters`);
  }

  if (max !== undefined && length > max) {
    throw new Error(`${fieldName} must be no more than ${max} characters`);
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Remove dangerous script tags and event handlers
 */
export function stripDangerousContent(input: string): string {
  let sanitized = input;

  // Remove script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  return sanitized;
}
