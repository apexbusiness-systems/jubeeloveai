const fs = require('fs');

let t = fs.readFileSync('src/hooks/__tests__/useAuth.test.ts', 'utf8');

t = t.replace(
  "vi.mocked(supabase.auth.getSession).mockReturnValueOnce(new Promise(() => {}) as any)",
  "vi.mocked(supabase.auth.getSession).mockReturnValueOnce(new Promise(() => {}) as unknown as ReturnType<typeof supabase.auth.getSession>)"
);

t = t.replace(
  "const deferred = createDeferred<any>()",
  "const deferred = createDeferred<unknown>()"
);

t = t.replace(
  "vi.mocked(supabase.auth.getSession).mockReturnValueOnce(deferred.promise as any)",
  "vi.mocked(supabase.auth.getSession).mockReturnValueOnce(deferred.promise as unknown as ReturnType<typeof supabase.auth.getSession>)"
);

t = t.replace(
  "const deferred = createDeferred<any>()",
  "const deferred = createDeferred<unknown>()"
);

t = t.replace(
  "vi.mocked(supabase.auth.getSession).mockReturnValueOnce(deferred.promise as any)",
  "vi.mocked(supabase.auth.getSession).mockReturnValueOnce(deferred.promise as unknown as ReturnType<typeof supabase.auth.getSession>)"
);

fs.writeFileSync('src/hooks/__tests__/useAuth.test.ts', t);
