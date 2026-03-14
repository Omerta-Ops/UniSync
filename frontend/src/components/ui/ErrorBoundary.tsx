/**
 * ErrorBoundary — Catches unhandled React rendering errors.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          className="h-screen w-screen flex items-center justify-center"
          style={{
            background: 'var(--uni-gradient-bg)',
            fontFamily: 'var(--uni-font-family)',
          }}
        >
          <div className="text-center max-w-md px-6">
            <div className="text-5xl mb-4">💥</div>
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: 'var(--uni-text-primary)' }}
            >
              Something went wrong
            </h1>
            <p
              className="text-sm mb-6"
              style={{ color: 'var(--uni-text-muted)' }}
            >
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl text-sm font-medium transition-all"
              style={{
                background: 'var(--uni-gradient-primary)',
                color: 'var(--uni-text-primary)',
              }}
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
