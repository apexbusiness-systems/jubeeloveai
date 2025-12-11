import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// Prefer build-time injected version (e.g., VITE_APP_VERSION/Git SHA)
const appVersion =
  process.env.VITE_APP_VERSION ||
  process.env.GITHUB_SHA ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  "dev";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'assets/**'],
      manifest: {
        name: 'Jubee Love - Educational Learning for Kids',
        short_name: 'Jubee Love',
        description: 'Fun educational activities including writing practice, shape recognition, story time, and games for children',
        theme_color: '#FFD93D',
        background_color: '#FFF5E6',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/jubee-icon-512.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/jubee-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/jubee-icon-512.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/jubee-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        categories: ['education', 'kids', 'entertainment']
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      },
      // Avoid service worker in dev to prevent cache confusion
      devOptions: {
        enabled: false,
        type: 'module'
      }
    })
  ].filter(Boolean),
  define: {
    // Make the app version available at runtime
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize bundle splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-tabs', '@radix-ui/react-select'],
          'vendor-animation': ['framer-motion', '@react-spring/three'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-supabase': ['@supabase/supabase-js'],
          // Feature chunks
          'games': [
            './src/modules/games/MemoryGame',
            './src/modules/games/PatternGame',
            './src/modules/games/NumberGame',
            './src/modules/games/AlphabetGame',
            './src/modules/games/ColorGame',
            './src/modules/games/PuzzleGame',
          ],
          'reading': [
            './src/modules/reading/StoryTime',
            './src/modules/reading/ReadingPractice',
          ],
        },
      },
    },
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Optimize chunk sizes
    chunkSizeWarningLimit: 600,
  },
  optimizeDeps: {
    // Pre-bundle heavy dependencies
    include: ['three', 'framer-motion', '@tanstack/react-query'],
  },
}));
