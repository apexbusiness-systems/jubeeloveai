import { Component, ReactNode, ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { errorHandler, ERROR_MESSAGES } from '@/lib/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    retryCount: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });

    // Log error with context
    errorHandler.logError(error, {
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error } = this.state;
      const message = error?.name === 'ChunkLoadError' 
        ? ERROR_MESSAGES.network
        : ERROR_MESSAGES.generic;

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-6">
            {/* Jubee sad face */}
            <div className="flex justify-center">
              <div className="relative">
                <AlertTriangle className="h-24 w-24 text-destructive animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl">🐝</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-primary">
                {message.title}
              </h1>
              <p className="text-muted-foreground text-lg">
                {message.description}
              </p>
            </div>

            {this.state.retryCount > 0 && (
              <p className="text-sm text-muted-foreground">
                Retry attempts: {this.state.retryCount}
              </p>
            )}

            {/* Error details in development */}
            {!import.meta.env.PROD && error && (
              <details className="text-left bg-muted p-4 rounded-lg">
                <summary className="cursor-pointer font-medium text-sm mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-xs overflow-auto whitespace-pre-wrap break-words">
                  {error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                size="lg"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                {message.action}
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
