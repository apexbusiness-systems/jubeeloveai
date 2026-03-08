

## Problem Analysis

The edge function logs confirm both ElevenLabs (401 - free tier blocked) and OpenAI (429 - quota exhausted) are failing. This causes:

1. **Noisy preload requests**: On every app load, `audioManager.preloadForOffline()` fires ~10 TTS requests that all fail with 503, wasting edge function invocations
2. **Blank screen risk**: Already patched in previous message, but needs verification
3. **VoiceFallbackIndicator**: Already exists and is rendered in App.tsx — just need to confirm it's working correctly

## What's Already Done
- `VoiceFallbackIndicator` component exists and is rendered in `App.tsx`
- `edgeFunctionErrorHandler.ts` already handles 503 → returns null → triggers browser fallback
- `useJubeeStore.ts` already sets `usingFallbackVoice = true` on catch

## What Still Needs to Be Done

### 1. Patch preload to skip when TTS is exhausted (edge function side)
Add a short-circuit in the edge function: cache a "quota exhausted" flag in memory so that after the first failure from both providers, subsequent requests within the same worker lifecycle return 503 immediately without making external API calls. This dramatically reduces noisy logs and wasted latency.

**File**: `supabase/functions/text-to-speech/index.ts`
- Add a module-level `quotaExhaustedUntil` timestamp variable
- After both ElevenLabs + OpenAI fail, set `quotaExhaustedUntil = Date.now() + 5 * 60 * 1000` (5 min cooldown)
- At the top of the request handler (after rate limit check), if `Date.now() < quotaExhaustedUntil`, return 503 immediately with `ALL_TTS_UNAVAILABLE`

### 2. Patch preload to skip on client side when 503 detected
**File**: `src/lib/audioManager.ts` (lines 78-99)
- In `preloadForOffline()`, if the first preload fetch returns non-ok (especially 503), abort remaining preloads immediately instead of trying all 10 phrases

### 3. Verify VoiceFallbackIndicator integration
Already wired up — no changes needed. The indicator shows "Using device voice" when `usingFallbackVoice` is true.

## Summary of Changes

| File | Change |
|------|--------|
| `supabase/functions/text-to-speech/index.ts` | Add quota-exhausted cooldown cache to skip provider calls for 5 minutes after both fail |
| `src/lib/audioManager.ts` | Abort preload loop on first 503 response to stop noisy requests |

No database changes. No new components needed. Two files edited.

