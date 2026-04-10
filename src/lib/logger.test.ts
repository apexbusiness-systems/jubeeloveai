import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from './logger';

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redacts sensitive string arguments in warn', () => {
    logger.warn('This is a token: some-secret-token');
    expect(console.warn).toHaveBeenCalledWith('[Warning]', '[REDACTED]');
  });

  it('redacts sensitive string arguments in error', () => {
    logger.error('my password is password123');
    expect(console.error).toHaveBeenCalledWith('[Error]', '[REDACTED]');
  });

  it('does not redact non-sensitive strings', () => {
    logger.warn('This is a normal message');
    expect(console.warn).toHaveBeenCalledWith('[Warning]', 'This is a normal message');
  });

  it('redacts sensitive properties in objects', () => {
    logger.warn({ user: 'test', password: 'password123' });
    expect(console.warn).toHaveBeenCalledWith('[Warning]', { user: 'test', password: '[REDACTED]' });
  });
});
