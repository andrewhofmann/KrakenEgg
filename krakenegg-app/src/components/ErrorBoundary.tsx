import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Could send to crash reporting service here
    console.warn('ErrorBoundary caught:', error.message, errorInfo.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <AlertTriangle size={32} className="text-red-400 mb-3" />
          <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--ke-error)' }}>
            {this.props.fallbackTitle || 'Something went wrong'}
          </h3>
          <p className="text-xs mb-4 max-w-sm" style={{ color: 'var(--ke-text-secondary)' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors"
            style={{ backgroundColor: 'var(--ke-bg-hover)', color: 'var(--ke-text)' }}
          >
            <RefreshCw size={12} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
