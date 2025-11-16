/**
 * Environment variable validation on startup
 * Ensures all required configuration is present
 */

interface EnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseProjectId: string;
  sentryDsn?: string;
  appVersion: string;
}

class EnvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvValidationError';
  }
}

/**
 * Validate and parse environment variables
 * Throws error if required variables are missing
 */
export function validateEnv(): EnvConfig {
  const requiredVars = {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    supabaseProjectId: import.meta.env.VITE_SUPABASE_PROJECT_ID,
  };

  const missing: string[] = [];

  // Check required variables
  Object.entries(requiredVars).forEach(([key, value]) => {
    if (!value) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    throw new EnvValidationError(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file against .env.example'
    );
  }

  // Validate URL format
  try {
    new URL(requiredVars.supabaseUrl);
  } catch {
    throw new EnvValidationError(
      `Invalid VITE_SUPABASE_URL format: ${requiredVars.supabaseUrl}`
    );
  }

  return {
    supabaseUrl: requiredVars.supabaseUrl,
    supabaseAnonKey: requiredVars.supabaseAnonKey,
    supabaseProjectId: requiredVars.supabaseProjectId,
    sentryDsn: import.meta.env.VITE_SENTRY_DSN,
    appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  };
}

/**
 * Log environment configuration (safe for development)
 */
export function logEnvConfig(config: EnvConfig) {
  console.group('🔧 Environment Configuration');
  console.log('Supabase URL:', config.supabaseUrl);
  console.log('Supabase Project ID:', config.supabaseProjectId);
  console.log('Sentry Enabled:', !!config.sentryDsn);
  console.log('App Version:', config.appVersion);
  console.log('Mode:', import.meta.env.MODE);
  console.groupEnd();
}
