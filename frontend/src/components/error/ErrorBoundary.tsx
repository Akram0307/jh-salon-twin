import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isDetailsOpen: boolean;
};

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isDetailsOpen: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Send to error tracking service (e.g., Sentry)
    if (typeof window !== 'undefined' && (window as unknown as { Sentry?: { captureException: (e: Error) => void } }).Sentry) {
      (window as unknown as { Sentry: { captureException: (e: Error) => void } }).Sentry.captureException(error, {
        extra: { componentStack: errorInfo.componentStack },
      });
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null, isDetailsOpen: false });
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  toggleDetails = (): void => {
    this.setState((prev) => ({ isDetailsOpen: !prev.isDetailsOpen }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-zinc-900 p-8 shadow-2xl">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </div>

            {/* Error Message */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
              <p className="text-sm text-zinc-400">
                An unexpected error occurred. Please try again or return to the dashboard.
              </p>
            </div>

            {/* Error Details Toggle */}
            {this.props.showDetails !== false && this.state.error && (
              <div className="mb-6">
                <button
                  onClick={this.toggleDetails}
                  className="flex w-full items-center justify-between rounded-lg border border-white/[0.06] 
                    bg-white/[0.02] px-4 py-2 text-sm text-zinc-400 hover:bg-white/[0.04] transition-colors"
                >
                  <span>Error Details</span>
                  {this.state.isDetailsOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {this.state.isDetailsOpen && (
                  <div className="mt-2 rounded-lg border border-white/[0.06] bg-black/40 p-4">
                    <p className="text-xs font-mono text-red-400 mb-2">
                      {this.state.error.message}
                    </p>
                    {this.state.errorInfo?.componentStack && (
                      <pre className="text-[10px] font-mono text-zinc-500 overflow-auto max-h-32 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 
                  text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-white/[0.08] 
                  bg-white/[0.04] px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.08] transition-colors"
              >
                <Home className="h-4 w-4" />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Inline Error Component for smaller sections
export function InlineError({ 
  message = 'Failed to load content',
  onRetry 
}: { 
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/20 
      bg-red-500/5 p-6 text-center">
      <AlertTriangle className="h-8 w-8 text-red-400 mb-3" />
      <p className="text-sm text-zinc-300 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-lg bg-white/[0.06] px-4 py-2 
            text-sm text-zinc-300 hover:bg-white/[0.1] transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      )}
    </div>
  );
}

// Empty State Component
export function EmptyState({ 
  icon: Icon = AlertTriangle,
  title = 'No data found',
  description = 'There is nothing to display here yet.',
  action
}: {
  icon?: React.ElementType;
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] 
      bg-white/[0.02] p-8 text-center">
      <Icon className="h-10 w-10 text-zinc-600 mb-4" />
      <h3 className="text-sm font-medium text-white mb-2">{title}</h3>
      <p className="text-xs text-zinc-500 mb-4 max-w-xs">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium 
            text-white hover:bg-emerald-600 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
