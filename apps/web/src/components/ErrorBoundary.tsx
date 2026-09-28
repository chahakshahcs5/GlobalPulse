'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback UI. If not provided, a default error message is shown. */
  fallback?: ReactNode;
  /** Identifier for logging which boundary caught the error */
  name?: string;
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Reusable Error Boundary component that prevents a single component crash
 * from taking down the entire page. Wrap sections of the UI independently.
 *
 * Usage:
 *   <ErrorBoundary name="news-feed">
 *     <NewsFeed />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const boundaryName = this.props.name || 'unknown';
    console.error(`[ErrorBoundary:${boundaryName}] Component error caught:`, error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 text-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">
              Something went wrong
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 max-w-xs">
              {this.state.error?.message || 'An unexpected error occurred in this section.'}
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-red-600 hover:bg-red-700 text-white transition cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
