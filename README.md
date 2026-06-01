# Jubee.Love

Jubee.Love is an interactive educational web application for toddlers (ages 3–5), built around Jubee — an animated 3D bee mascot that guides children through games, stories, music, and daily learning quests. The app is designed as a Progressive Web App (PWA) with offline-first architecture, ensuring a seamless experience on mobile and tablet devices.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Development](#development)
- [Testing](#testing)
- [Build & Deployment](#build--deployment)
- [Architecture Highlights](#architecture-highlights)
- [License](#license)

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ (recommended: install via [nvm](https://github.com/nvm-sh/nvm))
- [Bun](https://bun.sh/) or npm

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd <PROJECT_NAME>

# Install dependencies
bun install

# Start the development server
bun run dev
```

The development server runs at `http://localhost:5173` by default.

---

## Project Structure

```
src/
  components/          # Shared UI components (shadcn/ui, custom)
  core/jubee/          # Jubee mascot engine (rendering, positioning, lifecycle)
  data/                # Static content libraries (stories, music, reading words)
  hooks/               # React hooks (auth, persistence, audio, tracking)
  i18n/                # Internationalization (EN, ES, FR, HI, ZH)
  integrations/        # Supabase client, OmniLink adapter
  lib/                 # Utilities, storage, sync, error handling
  modules/             # Feature modules (games, dance, stories, shapes, writing)
  pages/               # Route-level page components
  store/               # Zustand state stores (settings, progress, achievements)
  types/               # TypeScript type definitions
  workers/             # Web workers (achievements, drawing)
supabase/
  functions/           # Edge functions (TTS, STT, screen-time alerts, SFX)
  migrations/          # Database schema migrations
e2e/                   # Playwright end-to-end tests
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18, Vite 5 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v3 |
| Components | shadcn/ui, Radix UI |
| State | Zustand |
| 3D / Animation | Three.js (direct rendering), CSS transitions |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions) |
| Sync | IndexedDB (offline-first) + Supabase sync |
| Testing | Vitest (unit), Playwright (E2E) |
| Monitoring | Sentry, custom performance budgets |

---

## Development

### Available Scripts

```sh
bun run dev              # Start dev server
bun run build            # Production build
bun run preview          # Preview production build locally

bun run typecheck        # TypeScript strict check
bun run lint             # ESLint with auto-fix
bun run test             # Unit tests (Vitest)
bun run test:ci          # Coverage reporting
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase project credentials:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## Testing

```sh
# Unit & integration tests
bun run test

# E2E tests (requires dev server running)
npx playwright test

# Full quality gate (typecheck + lint + test + build)
bun run typecheck && bun run lint && bun run test && bun run build
```

---

## Build & Deployment

```sh
# Production bundle
bun run build

# Output is written to `dist/`, ready for static hosting or CDN deployment.
```

---

## Architecture Highlights

- **Offline-First**: IndexedDB with debounced auto-save; Supabase syncs in the background.
- **Jubee Mascot Engine**: Direct Three.js rendering with adaptive quality profiles, visibility guards, and spatial freedom.
- **Parental Controls**: Hidden `/parent` route (3-second long-press on settings), screen-time limits, and schedule enforcement.
- **Accessibility**: Large touch targets, synced read-aloud captions, calm mode for sensitive children, WCAG-aligned color contrast.
- **Security**: Row-Level Security (RLS), input sanitization, secure token storage, and zero client-side secrets.
- **Internationalization**: UI and TTS support for English, Spanish, French, Mandarin, and Hindi.

---

## License

© Jubee.Love. All rights reserved.
