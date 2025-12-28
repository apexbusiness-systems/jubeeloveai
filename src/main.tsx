import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";
import { runMigrations } from "./lib/storageVersion";
import { logger } from "./lib/logger";
import { initializeGlobalErrorHandlers } from "./lib/globalErrorHandlers";
import { initSentry } from "./lib/sentry";
import { validateEnv } from "./lib/envValidation";

let envError: Error | null = null;
if (import.meta.env.PROD) {
  try {
    validateEnv();
  } catch (error) {
    envError = error instanceof Error ? error : new Error('Unknown environment error');
    logger.error('Startup configuration error:', envError.message);
  }
}

// Initialize Sentry for error tracking
if (!envError) {
  initSentry();
}

// Initialize global error handlers
if (!envError) {
  initializeGlobalErrorHandlers();
}

// Initialize storage migrations
if (!envError) {
  try {
    runMigrations();
  } catch (error) {
    logger.error('Storage migration failed:', error);
  }
}

// Register service worker for PWA (production only to avoid caching issues in dev)
if (!envError && import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? 'dev';
    const VERSION_KEY = 'app_version';
    
    // Clear old caches silently if version changed
    const storedVersion = localStorage.getItem(VERSION_KEY);
    if (storedVersion && storedVersion !== APP_VERSION) {
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        localStorage.setItem(VERSION_KEY, APP_VERSION);
        logger.dev('Caches cleared for version update:', APP_VERSION);
      }).catch(err => logger.error('Cache clearing failed:', err));
    } else if (!storedVersion) {
      localStorage.setItem(VERSION_KEY, APP_VERSION);
    }
    
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        logger.dev('ServiceWorker registration successful:', registration.scope);
        
        // Manual update hook for Settings/debug surfaces
        (window as unknown as { checkForSwUpdate?: () => void }).checkForSwUpdate = () => {
          registration.update();
        };

        // Auto-update on new service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available, reload silently after a delay
                setTimeout(() => window.location.reload(), 1000);
              }
            });
          }
        });
        
        // Check for updates every 15 minutes (reduced polling load)
        setInterval(() => {
          registration.update();
        }, 900000);
      },
      (err) => {
        logger.error('ServiceWorker registration failed:', err);
      }
    );
  });
}

createRoot(document.getElementById("root")!).render(
  envError ? (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-xl w-full rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h1 className="text-2xl font-semibold">Configuration required</h1>
        <p className="text-muted-foreground">
          The application is missing required environment configuration and cannot start.
        </p>
        <div className="rounded-md bg-muted p-4 text-sm font-mono whitespace-pre-wrap">
          {envError.message}
        </div>
        <p className="text-sm text-muted-foreground">
          Verify your deployment environment variables and reload the page.
        </p>
      </div>
    </div>
  ) : (
    <ThemeProvider defaultTheme="light" attribute="class" enableSystem={false}>
      <App />
    </ThemeProvider>
  )
);

// Lazy load console commands after React renders to avoid circular dependencies
if (!envError) {
  setTimeout(() => {
    import("./performance/verifyParentJourneyClient");
  }, 0);
}
