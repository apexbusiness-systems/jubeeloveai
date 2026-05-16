export function resolveAllowedOrigin(origin: string | null, allowedOriginsEnv?: string): string {
  if (!origin) return 'null';
  const allowedOrigins = (allowedOriginsEnv ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
  if (allowedOrigins.includes(origin) || (!allowedOriginsEnv && isLocalhost)) {
    return origin;
  }
  return 'null';
}

export function getCorsHeaders(req: Request, allowHeaders: string) {
  const origin = resolveAllowedOrigin(req.headers.get('origin'), Deno.env.get('ALLOWED_ORIGINS'));
  return {
    // Vary by Origin so caches do not reuse CORS responses across sites.
    Vary: 'Origin',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': allowHeaders,
    // Keep methods explicit to avoid accidental method expansion.
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  };
}
