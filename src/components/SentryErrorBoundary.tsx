import * as Sentry from '@sentry/react';
import { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SentryErrorBoundaryProps {
  children: ReactNode;
}

/**
 * Error Boundary with Sentry integration
 * Automatically reports errors to Sentry
 */
export function SentryErrorBoundary({ children }: SentryErrorBoundaryProps) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <AlertTriangle className="w-16 h-16 mx-auto text-destructive" />
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground max-w-md">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
            <Button onClick={resetError}>Try Again</Button>
          </div>
        </div>
      )}
      beforeCapture={(scope) => {
        scope.setTag('boundary', 'app');
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
