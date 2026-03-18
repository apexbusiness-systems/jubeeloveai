/// <reference types="vite/client" />

// Provide NodeJS namespace for timer types used across the codebase
declare namespace NodeJS {
  interface Timeout {}
  interface Timer {}
}

// Provide global for test setup files
declare var global: typeof globalThis;
