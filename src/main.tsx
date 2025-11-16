import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";
import { initSentry } from "./lib/sentry";
import { validateEnv, logEnvConfig } from "./lib/envValidation";

// Validate environment configuration on startup
try {
  const config = validateEnv();
  
  if (import.meta.env.DEV) {
    logEnvConfig(config);
  }

  // Initialize Sentry if configured
  initSentry();
} catch (error) {
  console.error('❌ Environment Configuration Error:', error);
  if (import.meta.env.DEV) {
    alert(
      'Environment configuration error. Please check console for details.\n\n' +
      'Make sure you have copied .env.example to .env and filled in the required values.'
    );
  }
}

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('ServiceWorker registration successful:', registration.scope);
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute
      },
      (err) => {
        console.log('ServiceWorker registration failed:', err);
      }
    );
  });
}

createRoot(document.getElementById("root")!).render(<App />);
