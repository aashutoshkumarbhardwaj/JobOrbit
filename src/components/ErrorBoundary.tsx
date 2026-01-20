import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || `error-${Date.now()}`;
    
    // Enhanced error logging for production
    const errorData = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    };

    console.error('ErrorBoundary caught an error:', errorData);
    
    // Store error for debugging (in production, you'd send this to a logging service)
    try {
      const errors = JSON.parse(localStorage.getItem('app-errors') || '[]');
      errors.push(errorData);
      // Keep only last 10 errors
      if (errors.length > 10) {
        errors.splice(0, errors.length - 10);
      }
      localStorage.setItem('app-errors', JSON.stringify(errors));
    } catch (e) {
      console.warn('Failed to store error in localStorage:', e);
    }

    this.setState({ error, errorInfo, errorId });
  }

  handleReload = () => {
    // Clear any potentially corrupted state
    try {
      window.location.reload();
    } catch (error) {
      console.error('Failed to reload page:', error);
      // Fallback: navigate to home
      window.location.href = '/';
    }
  };

  handleGoHome = () => {
    try {
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to navigate home:', error);
    }
  };

  handleClearErrors = () => {
    try {
      localStorage.removeItem('app-errors');
    } catch (error) {
      console.warn('Failed to clear errors:', error);
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDevelopment = process.env.NODE_ENV === 'development';
      const errorId = this.state.errorId;

      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Something went wrong
            </h1>
            
            <p className="text-muted-foreground mb-6">
              We're sorry, but something unexpected happened. The error has been logged and we'll look into it.
            </p>
            
            {errorId && (
              <p className="text-xs text-muted-foreground mb-4">
                Error ID: <code className="bg-muted px-2 py-1 rounded">{errorId}</code>
              </p>
            )}
            
            {isDevelopment && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
                  <Bug className="h-4 w-4" />
                  Error Details (Development Only)
                </summary>
                <div className="mt-2 p-4 bg-muted rounded text-xs text-foreground overflow-auto max-h-40">
                  <pre className="whitespace-pre-wrap">{this.state.error.toString()}</pre>
                  {this.state.errorInfo && (
                    <pre className="mt-2 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                  )}
                </div>
              </details>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleReload}
                className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Page
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="border-border hover:bg-muted transition-colors"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>
            
            {isDevelopment && (
              <Button
                onClick={this.handleClearErrors}
                variant="ghost"
                size="sm"
                className="mt-4 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear Error Log
              </Button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
