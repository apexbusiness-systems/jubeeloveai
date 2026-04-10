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

// Helper to buffer to base64
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper base64 to buffer
function base64ToBuffer(base64: string): Uint8Array {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

// Derive AES-GCM key using SHA-256
async function deriveKey(keyString: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.digest('SHA-256', enc.encode(keyString));
  return crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

// Secure AES-GCM encryption
async function secureEncrypt(text: string, keyString: string): Promise<string> {
  const key = await deriveKey(keyString);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(text)
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  return bufferToBase64(combined.buffer);
}

// Secure AES-GCM decryption
async function secureDecrypt(encryptedBase64: string, keyString: string): Promise<string> {
  const key = await deriveKey(keyString);
  const combined = base64ToBuffer(encryptedBase64);

  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );

  const dec = new TextDecoder();
  return dec.decode(decrypted);
}

// Legacy XOR decryption (kept for backwards compatibility to prevent data loss)
function legacyDecrypt(encrypted: string, key: string): string {
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
    const encrypted = await secureEncrypt(stringified, encryptionKey);
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
    let decrypted = '';

    try {
      decrypted = await secureDecrypt(encrypted, encryptionKey);
    } catch (e) {
      // Fallback to legacy decryption if AES-GCM fails (e.g. for existing data)
      decrypted = legacyDecrypt(encrypted, encryptionKey);
    }

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
