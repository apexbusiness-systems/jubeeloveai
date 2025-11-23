import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";
import { runMigrations } from "./lib/storageVersion";
import { logger } from "./lib/logger";

// Service Worker is automatically registered by vite-plugin-pwa
// See vite.config.ts for PWA configuration
// Manual registration removed to prevent duplicate service worker registration

// Production environment validation
if (import.meta.env.PROD) {
  // Validate critical environment variables
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY'
  ];

  const missing = requiredEnvVars.filter(key => !import.meta.env[key]);

  if (missing.length > 0) {
    console.error(
      `[Production Error] Missing required environment variables: ${missing.join(', ')}\n` +
      'The application may not function correctly.'
    );
  }
}

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('[Global Error]:', event.error);
  // In production, you could send this to an error tracking service
  // Example: Sentry.captureException(event.error);
});

// Global promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise Rejection]:', event.reason);
  // In production, you could send this to an error tracking service
  // Example: Sentry.captureException(event.reason);
});

createRoot(document.getElementById("root")!).render(<App />);
