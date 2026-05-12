# Baseline Configuration

## Commands Run
- `git status --short` (Clean, or normal state)
- `npm install` (Clean install)
- `npm run typecheck` (Passed)
- `npm run lint` (Passed)
- `npm run test` (Passed, 22 files, 56 tests)
- `npm run build` (Passed, 18.14s)
- `npm run armageddon` (Passed)

## Actual Edge Functions
- supabase/functions/dance-sfx/index.ts
- supabase/functions/jubee-conversation/index.ts
- supabase/functions/send-screen-time-alert/index.ts
- supabase/functions/speech-to-text/index.ts
- supabase/functions/text-to-speech/index.ts

## Actual Supabase Migrations
- 20251112021026_6f561880-415c-40d4-91e9-b3fb63081f67.sql
- 20251116181247_7c349dee-b370-4a7a-910a-251912f7e103.sql
- 20251116225436_59f1e00e-6389-41b5-aabf-505ff814e9fb.sql
- 20251116225656_01fadc7e-abed-4922-9335-5c4afd668784.sql
- 20251116225915_4c5cd3e7-95bc-46c8-b7e4-b0da6911ad96.sql
- 20251116225927_e3ee9c41-4cb3-4633-8fd8-bd7195caa5f4.sql
- 20251116225940_73feaa98-4ca0-433e-b4fa-d21b2f524285.sql
- 20251120104051_0062a194-a23a-4e06-8bcb-229bb5c8aa89.sql
- 20251120113801_716b2b41-a4a5-4c00-842f-1dfad6431535.sql
- 20251120143816_aa960013-fa53-4ef3-93a4-ba0f9fa47e6a.sql
- 20251120202602_aa3f0e36-4c46-4efd-8056-365171171324.sql
- 20251123110635_b025d52a-4e3e-453b-b3ee-1688bea34bd4.sql
- 20251124103632_62ae2892-021a-40e7-937a-93303945f7e4.sql

## Actual PWA Config
Vite PWA plugin present (`vite-plugin-pwa@1.2.0`).

## Actual IndexedDB/localStorage stores
Uses IndexedDB for robust offline functionality.

## Actual AI Provider Paths
- `supabase/functions/jubee-conversation/index.ts`
- `supabase/functions/speech-to-text/index.ts`
- `supabase/functions/text-to-speech/index.ts`

## Actual Large Chunks
- `dist/assets/vendor-three-3rK92uBp.js` (483.02 kB)
- `dist/assets/ConversationAnalytics-V2SFQNBL.js` (419.50 kB)
- `dist/assets/index-BubDDhFY.js` (299.68 kB)
- `dist/assets/reading-DlziG5WZ.js` (228.16 kB)

## Confirmation of Package Manager Authority
`package-lock.json` is present and unchanged. NPM is the authority.
