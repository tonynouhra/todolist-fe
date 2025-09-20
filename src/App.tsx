import React from 'react';
import { CssBaseline } from '@mui/material';
import { ClerkProvider } from './contexts/ClerkProvider';
import { QueryProvider } from './contexts/QueryProvider';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { PerformanceMonitor } from './components/common/PerformanceMonitor';
import { FocusManager } from './components/common/FocusManager';
import { AppRouter } from './router/AppRouter';

function App() {
  return (
    <ErrorBoundary>
      <PerformanceMonitor>
        <ClerkProvider>
          <QueryProvider>
            <NotificationProvider>
              <ThemeProvider>
                <CssBaseline />
                <FocusManager
                  skipLinks={[
                    { href: '#main-content', label: 'Skip to main content' },
                    { href: '#navigation', label: 'Skip to navigation' },
                  ]}
                >
                  <AppRouter />
                </FocusManager>
              </ThemeProvider>
            </NotificationProvider>
          </QueryProvider>
        </ClerkProvider>
      </PerformanceMonitor>
    </ErrorBoundary>
  );
}

export default App;
