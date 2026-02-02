/**
 * Secure Storage Utility
 * Provides encrypted localStorage wrapper for sensitive data
 * 
 * SECURITY NOTE: This uses a simple encryption for browser storage.
 * For highly sensitive data, always prefer server-side storage.
 */

import { supabase } from '@/integrations/supabase/client';

// Simple encryption key derivation from user session
async function getEncryptionKey(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch {
    // Fall back to device identifier when auth is unavailable
  }

  // Use a stable device identifier for non-authenticated users
  let deviceId = localStorage.getItem('jubee-device-id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('jubee-device-id', deviceId);
  }
  return deviceId;
}

// Simple XOR encryption (NOT for highly sensitive data)
// For production, consider using Web Crypto API with proper key management
function simpleEncrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result); // Base64 encode
}

function simpleDecrypt(encrypted: string, key: string): string {
  try {
    const text = atob(encrypted); // Base64 decode
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch {
    return '';
  }
}

/**
 * Securely store sensitive data with encryption
 */
export async function secureSetItem(key: string, value: unknown): Promise<void> {
  try {
    const encryptionKey = await getEncryptionKey();
    const stringified = JSON.stringify(value);
    const encrypted = simpleEncrypt(stringified, encryptionKey);
    localStorage.setItem(`secure:${key}`, encrypted);
  } catch (error) {
    console.error(`[SecureStorage] Failed to save ${key}:`, error);
    throw new Error('Failed to save secure data');
  }
}

/**
 * Retrieve and decrypt sensitive data
 */
export async function secureGetItem<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const encrypted = localStorage.getItem(`secure:${key}`);
    if (!encrypted) return defaultValue;
    
    const encryptionKey = await getEncryptionKey();
    const decrypted = simpleDecrypt(encrypted, encryptionKey);
    if (!decrypted) return defaultValue;
    
    return JSON.parse(decrypted) as T;
  } catch (error) {
    console.error(`[SecureStorage] Failed to load ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Remove secure item
 */
export function secureRemoveItem(key: string): void {
  localStorage.removeItem(`secure:${key}`);
}

/**
 * Check if secure item exists
 */
export function secureHasItem(key: string): boolean {
  return localStorage.getItem(`secure:${key}`) !== null;
}

/**
 * Clear all secure storage
 */
export function secureClearAll(): void {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('secure:')) {
      localStorage.removeItem(key);
    }
  });
}
