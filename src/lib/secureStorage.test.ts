import { describe, it, expect, beforeEach, vi } from 'vitest';
import { secureSetItem, secureGetItem, secureRemoveItem, secureHasItem, secureClearAll } from './secureStorage';

// Mock the getEncryptionKey logic
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } }
      })
    }
  }
}));

describe('secureStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should securely set and get an item', async () => {
    const data = { secret: 'message', num: 42 };

    await secureSetItem('testKey', data);

    // It should not be stored as plaintext in localStorage
    const stored = localStorage.getItem('secure:testKey');
    expect(stored).toBeTruthy();
    expect(stored).not.toContain('message');
    expect(stored).not.toContain('42');

    // It should decrypt back to the original object
    const retrieved = await secureGetItem('testKey', null);
    expect(retrieved).toEqual(data);
  });

  it('should handle legacy XOR encrypted data seamlessly', async () => {
    const keyString = 'test-user-id';
    const data = { test: 'legacy' };
    const stringified = JSON.stringify(data);

    // Manually create legacy encrypted data
    let result = '';
    for (let i = 0; i < stringified.length; i++) {
      result += String.fromCharCode(stringified.charCodeAt(i) ^ keyString.charCodeAt(i % keyString.length));
    }
    const legacyEncrypted = btoa(result);

    localStorage.setItem('secure:legacyKey', legacyEncrypted);

    // Decrypt should fallback to legacy logic and return the parsed data
    const retrieved = await secureGetItem('legacyKey', null);
    expect(retrieved).toEqual(data);
  });

  it('should return default value if item does not exist', async () => {
    const retrieved = await secureGetItem('missingKey', 'defaultValue');
    expect(retrieved).toBe('defaultValue');
  });

  it('should remove an item correctly', async () => {
    await secureSetItem('toRemove', 'test');
    expect(secureHasItem('toRemove')).toBe(true);

    secureRemoveItem('toRemove');
    expect(secureHasItem('toRemove')).toBe(false);

    const retrieved = await secureGetItem('toRemove', 'def');
    expect(retrieved).toBe('def');
  });

  it('should clear all secure items', async () => {
    await secureSetItem('key1', 'val1');
    await secureSetItem('key2', 'val2');
    localStorage.setItem('nonSecureKey', 'val3');

    secureClearAll();

    expect(secureHasItem('key1')).toBe(false);
    expect(secureHasItem('key2')).toBe(false);
    expect(localStorage.getItem('nonSecureKey')).toBe('val3');
  });
});
