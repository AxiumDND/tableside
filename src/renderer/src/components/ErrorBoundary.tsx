import React, { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('React Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-stone-900 p-8">
          <div className="w-full max-w-2xl rounded-lg border border-red-800 bg-stone-800 p-8 shadow-xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-900/50">
                <svg
                  className="h-6 w-6 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-red-400">Something went wrong</h1>
                <p className="mt-1 text-sm text-stone-400">
                  The application encountered an unexpected error
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="mb-6 space-y-3">
                <div className="rounded bg-stone-900/50 p-4">
                  <h2 className="mb-2 text-sm font-semibold text-stone-300">Error Message</h2>
                  <p className="font-mono text-sm text-red-400">{this.state.error.message}</p>
                </div>

                {this.state.errorInfo && (
                  <details className="rounded bg-stone-900/50 p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-stone-300 hover:text-stone-200">
                      Stack Trace
                    </summary>
                    <pre className="mt-2 max-h-64 overflow-auto text-xs text-stone-400">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReload}
                className="rounded-lg bg-amber-700 px-6 py-3 font-semibold text-stone-100 transition-colors hover:bg-amber-600"
              >
                Reload Application
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="rounded-lg border border-stone-600 bg-stone-700 px-6 py-3 font-semibold text-stone-200 transition-colors hover:bg-stone-600"
              >
                Try Again
              </button>
            </div>

            <div className="mt-6 rounded border border-stone-700 bg-stone-900/30 p-4">
              <p className="text-sm text-stone-400">
                If this problem persists, try closing and reopening the application. Check the log
                files in your user data folder for more details.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
