/// <reference types="vite/client" />

// Provide NodeJS namespace for timer types used across the codebase
declare namespace NodeJS {
  interface Timeout { _brand?: "Timeout" }
  interface Timer { _brand?: "Timer" }
}

// Provide global for test setup files
declare let global: typeof globalThis;
