import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";
import { runMigrations } from "./lib/storageVersion";
import { logger } from "./lib/logger";

// Initialize storage migrations
try {
  runMigrations();
} catch (error) {
  logger.error('Storage migration failed:', error);
}

// Register service worker for PWA (production only to avoid caching issues in dev)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const APP_VERSION = '1.0.1';
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
        
        // Check for updates every 5 minutes instead of every minute
        setInterval(() => {
          registration.update();
        }, 300000); // Changed from 60000 (1min) to 300000 (5min)
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
