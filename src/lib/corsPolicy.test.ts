import { describe, it, expect } from 'vitest';
import { getCorsHeaders, resolveAllowedOrigin } from '../../supabase/functions/_shared/cors';

describe('resolveAllowedOrigin', () => {
  it('allows explicitly configured production origins', () => {
    const allowed = resolveAllowedOrigin('https://app.example.com', 'https://app.example.com,https://www.example.com');
    expect(allowed).toBe('https://app.example.com');
  });

  it('rejects non-allowlisted production origins', () => {
    const rejected = resolveAllowedOrigin('https://evil.example.com', 'https://app.example.com');
    expect(rejected).toBe('null');
  });

  it('allows localhost only when allowlist is unset', () => {
    expect(resolveAllowedOrigin('http://localhost:5173', undefined)).toBe('http://localhost:5173');
    expect(resolveAllowedOrigin('http://localhost:5173', 'https://app.example.com')).toBe('null');
  });
});

describe('getCorsHeaders', () => {
  it('adds cache-safe Vary and explicit method headers', () => {
    (globalThis as { Deno?: { env: { get: (key: string) => string | undefined } } }).Deno = {
      env: { get: () => 'https://app.example.com' },
    };
    const req = new Request('https://example.test', {
      headers: { origin: 'https://app.example.com' },
    });
    const headers = getCorsHeaders(req, 'authorization,content-type');
    expect(headers.Vary).toBe('Origin');
    expect(headers['Access-Control-Allow-Methods']).toBe('GET,POST,OPTIONS');
    expect(headers['Access-Control-Allow-Headers']).toBe('authorization,content-type');
  });
});
