import { createRoot } from "react-dom/client";
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

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        logger.dev('ServiceWorker registration successful:', registration.scope);
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute
      },
      (err) => {
        logger.error('ServiceWorker registration failed:', err);
      }
    );
  });
}

createRoot(document.getElementById("root")!).render(<App />);
