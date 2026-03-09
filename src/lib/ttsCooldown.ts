// src/lib/ttsCooldown.ts

// Single source of truth for TTS availability across all callers

const TTS_COOLDOWN_MS = 5 * 60 * 1000;

let _unavailableUntil = 0;

export const ttsCooldown = {
  isActive: (): boolean => Date.now() < _unavailableUntil,
  markUnavailable: (): void => { _unavailableUntil = Date.now() + TTS_COOLDOWN_MS; },
  clear: (): void => { _unavailableUntil = 0; },
};
