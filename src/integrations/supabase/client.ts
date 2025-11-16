// Production-ready Supabase client with environment variable configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Environment variables with runtime validation
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Validate environment variables at runtime
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.\n' +
    'Required: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY'
  );
}

// Validate URL format
try {
  new URL(SUPABASE_URL);
} catch {
  throw new Error(`Invalid VITE_SUPABASE_URL: ${SUPABASE_URL}`);
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Use PKCE flow for enhanced security
  },
  global: {
    headers: {
      'X-Client-Info': 'jubeelove-web',
    },
  },
});