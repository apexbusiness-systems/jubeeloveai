import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";
import { runMigrations } from "./lib/storageVersion";
import { logger } from "./lib/logger";
import { initializeGlobalErrorHandlers } from "./lib/globalErrorHandlers";
import { initSentry } from "./lib/sentry";
// Initialize Sentry for error tracking
initSentry();

// Initialize global error handlers
initializeGlobalErrorHandlers();

// Initialize storage migrations
try {
  runMigrations();
} catch (error) {
  logger.error('Storage migration failed:', error);
}

// Register service worker for PWA (production only to avoid caching issues in dev)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
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
  <ThemeProvider defaultTheme="light" attribute="class" enableSystem={false}>
    <App />
  </ThemeProvider>
);

// Lazy load console commands after React renders to avoid circular dependencies
setTimeout(() => {
  import("./performance/verifyParentJourneyClient");
}, 0);
