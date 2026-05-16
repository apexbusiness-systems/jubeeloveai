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
  return {
    'Access-Control-Allow-Origin': resolveAllowedOrigin(
      req.headers.get('origin'),
      Deno.env.get('ALLOWED_ORIGINS'),
    ),
    'Access-Control-Allow-Headers': allowHeaders,
  };
}
