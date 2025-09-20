import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Alert, AlertTitle } from '@mui/material';
import {
  Animation as AnimationIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  animationType?: string;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
}

export class AnimationErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  public state: State = {
    hasError: false,
    retryCount: 0,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryCount: 0 };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { animationType = 'unknown', componentName = 'unknown' } = this.props;

    // Enhanced error logging with device context
    const deviceInfo = {
      userAgent: navigator.userAgent,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory,
      connection: (navigator as any).connection?.effectiveType,
      reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)')
        .matches,
    };

    console.error(
      `Animation error in ${componentName} (${animationType}):`,
      error,
      errorInfo,
      'Device context:',
      deviceInfo
    );

    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Enhanced error reporting for production with device context
    if (process.env.NODE_ENV === 'production') {
      try {
        // This would integrate with your error tracking service
        const errorReport = {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          animationType,
          componentName,
          deviceInfo,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          retryCount: this.state.retryCount,
        };

        // Example integration points:
        // Sentry.captureException(error, { extra: errorReport });
        // LogRocket.captureException(error);
        // Custom analytics service

        console.error('Production Animation Error Report:', errorReport);

        // Dispatch custom event for error tracking
        window.dispatchEvent(
          new CustomEvent('animationError', {
            detail: errorReport,
          })
        );
      } catch (reportingError) {
        console.debug('Error reporting failed:', reportingError);
      }
    }

    // Attempt to recover gracefully by disabling animations
    try {
      document.documentElement.style.setProperty('--animation-duration', '0ms');
      document.documentElement.style.setProperty(
        '--transition-duration',
        '0ms'
      );

      // Re-enable after a delay to allow for recovery
      setTimeout(() => {
        document.documentElement.style.removeProperty('--animation-duration');
        document.documentElement.style.removeProperty('--transition-duration');
      }, 5000);
    } catch (recoveryError) {
      console.debug('Animation recovery attempt failed:', recoveryError);
    }
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState((prevState) => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1,
      }));
    } else {
      // Max retries reached, reload the page
      window.location.reload();
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: 0,
    });
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { animationType, componentName } = this.props;
      const canRetry = this.state.retryCount < this.maxRetries;

      // Production-optimized minimal error UI for animation failures
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="200px"
          p={2}
          textAlign="center"
          sx={{
            // Ensure error UI doesn't cause additional animation issues
            '& *': {
              transition: 'none !important',
              animation: 'none !important',
            },
          }}
        >
          <Alert
            severity="warning"
            sx={{
              mb: 2,
              maxWidth: 500,
              // Disable animations on error UI
              transition: 'none !important',
              animation: 'none !important',
            }}
          >
            <AlertTitle>
              <Box display="flex" alignItems="center" gap={1}>
                <AnimationIcon />
                Animation Issue Detected
              </Box>
            </AlertTitle>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {animationType && componentName
                ? `The ${animationType} animation in ${componentName} encountered an issue.`
                : 'An animation encountered an issue.'}{' '}
              The component continues to work normally with reduced animations.
            </Typography>

            {/* Show device performance context in development */}
            {process.env.NODE_ENV === 'development' && (
              <Typography
                variant="caption"
                sx={{ mt: 1, display: 'block', opacity: 0.7 }}
              >
                Device: {navigator.hardwareConcurrency || 'unknown'} cores,
                {(navigator as any).deviceMemory || 'unknown'}GB RAM
              </Typography>
            )}
          </Alert>

          <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center">
            {canRetry ? (
              <Button
                variant="contained"
                size="small"
                onClick={this.handleRetry}
                sx={{ transition: 'none !important' }}
              >
                Retry ({this.maxRetries - this.state.retryCount} left)
              </Button>
            ) : (
              <Button
                variant="contained"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={() => window.location.reload()}
                sx={{ transition: 'none !important' }}
              >
                Reload Page
              </Button>
            )}
            <Button
              variant="outlined"
              size="small"
              onClick={this.handleReset}
              sx={{ transition: 'none !important' }}
            >
              Continue Without Animation
            </Button>
          </Box>

          {/* Enhanced development error details */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <Box
              mt={2}
              p={2}
              bgcolor="grey.100"
              borderRadius={1}
              maxWidth={600}
              overflow="auto"
              sx={{ transition: 'none !important' }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Error Details (Development Only)
              </Typography>
              <Typography
                variant="body2"
                component="pre"
                sx={{
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.7rem',
                  fontFamily: 'monospace',
                  mb: 1,
                }}
              >
                {this.state.error.toString()}
              </Typography>

              {/* Device performance context */}
              <Typography
                variant="caption"
                sx={{ display: 'block', mb: 1, opacity: 0.8 }}
              >
                Device Context: {navigator.hardwareConcurrency || 'unknown'}{' '}
                cores,
                {(navigator as any).deviceMemory || 'unknown'}GB RAM,
                {(navigator as any).connection?.effectiveType || 'unknown'}{' '}
                connection
              </Typography>

              <Typography
                variant="body2"
                component="pre"
                sx={{
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.6rem',
                  fontFamily: 'monospace',
                  opacity: 0.7,
                }}
              >
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

// Higher-order component for easier usage with animation components
export const withAnimationErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  animationType?: string,
  componentName?: string
) => {
  const WrappedComponent = (props: P) => (
    <AnimationErrorBoundary
      animationType={animationType}
      componentName={componentName || Component.displayName || Component.name}
    >
      <Component {...props} />
    </AnimationErrorBoundary>
  );

  WrappedComponent.displayName = `withAnimationErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
};

// Hook for handling animation errors in functional components
export const useAnimationErrorHandler = (
  animationType: string,
  componentName: string
) => {
  const handleAnimationError = React.useCallback(
    (error: Error) => {
      console.error(
        `Animation error in ${componentName} (${animationType}):`,
        error
      );

      // Report to error tracking service in production
      if (process.env.NODE_ENV === 'production') {
        console.error('Animation Error:', {
          error: error.message,
          stack: error.stack,
          animationType,
          componentName,
        });
      }
    },
    [animationType, componentName]
  );

  return handleAnimationError;
};
