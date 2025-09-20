import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Alert, AlertTitle } from '@mui/material';
import {
  Refresh as RefreshIcon,
  BugReport as BugReportIcon,
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="400px"
          p={3}
          textAlign="center"
        >
          <Alert severity="error" sx={{ mb: 3, maxWidth: 600 }}>
            <AlertTitle>
              <Box display="flex" alignItems="center" gap={1}>
                <BugReportIcon />
                Something went wrong
              </Box>
            </AlertTitle>
            <Typography variant="body2" sx={{ mt: 1 }}>
              An unexpected error occurred. Please try refreshing the page or
              contact support if the problem persists.
            </Typography>
          </Alert>

          <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center">
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={this.handleReload}
            >
              Reload Page
            </Button>
            <Button variant="outlined" onClick={this.handleReset}>
              Try Again
            </Button>
          </Box>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <Box
              mt={3}
              p={2}
              bgcolor="grey.100"
              borderRadius={1}
              maxWidth={800}
              overflow="auto"
            >
              <Typography variant="h6" gutterBottom>
                Error Details (Development Only)
              </Typography>
              <Typography
                variant="body2"
                component="pre"
                sx={{
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                }}
              >
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};
