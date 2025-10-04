import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { CircularProgress, Box } from '@mui/material';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

// Lazy load pages for code splitting
const SignInPage = React.lazy(() =>
  import('../pages/auth/SignInPage').then((module) => ({
    default: module.SignInPage,
  }))
);
const SignUpPage = React.lazy(() =>
  import('../pages/auth/SignUpPage').then((module) => ({
    default: module.SignUpPage,
  }))
);
const DashboardPage = React.lazy(() =>
  import('../pages/dashboard/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  }))
);
const TodosPage = React.lazy(() =>
  import('../pages/todos/TodosPage').then((module) => ({
    default: module.TodosPage,
  }))
);
const ProjectsPage = React.lazy(() =>
  import('../pages/projects/ProjectsPage').then((module) => ({
    default: module.ProjectsPage,
  }))
);
const AIPage = React.lazy(() =>
  import('../pages/ai/AIPage').then((module) => ({ default: module.AIPage }))
);
const SettingsPage = React.lazy(() =>
  import('../components/Settings').then((module) => ({
    default: module.SettingsPage,
  }))
);

// Loading component with accessibility features
const LoadingFallback: React.FC<{ message?: string }> = ({
  message = 'Loading...',
}) => (
  <Box
    display="flex"
    flexDirection="column"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
    component="output"
    aria-live="polite"
    aria-label={message}
  >
    <CircularProgress aria-label="Loading content" />
    <Box
      mt={2}
      component="span"
      sx={{ sr: { position: 'absolute', left: '-10000px' } }}
    >
      {message}
    </Box>
  </Box>
);

export const AppRouter: React.FC = () => {
  const { isLoaded, isSignedIn } = useAuth();

  // Show loading spinner while Clerk is initializing
  if (!isLoaded) {
    return <LoadingFallback message="Initializing authentication..." />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public routes */}
          <Route
            path="/sign-in"
            element={
              isSignedIn ? <Navigate to="/dashboard" replace /> : <SignInPage />
            }
          />
          <Route
            path="/sign-up"
            element={
              isSignedIn ? <Navigate to="/dashboard" replace /> : <SignUpPage />
            }
          />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Suspense
                  fallback={<LoadingFallback message="Loading dashboard..." />}
                >
                  <DashboardPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/todos"
            element={
              <ProtectedRoute>
                <Suspense
                  fallback={<LoadingFallback message="Loading todos..." />}
                >
                  <TodosPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Suspense
                  fallback={<LoadingFallback message="Loading projects..." />}
                >
                  <ProjectsPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai"
            element={
              <ProtectedRoute>
                <Suspense
                  fallback={
                    <LoadingFallback message="Loading AI features..." />
                  }
                >
                  <AIPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Suspense
                  fallback={<LoadingFallback message="Loading settings..." />}
                >
                  <SettingsPage />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* Root redirect */}
          <Route
            path="/"
            element={
              <Navigate to={isSignedIn ? '/dashboard' : '/sign-in'} replace />
            }
          />

          {/* Catch all - redirect to appropriate page */}
          <Route
            path="*"
            element={
              <Navigate to={isSignedIn ? '/dashboard' : '/sign-in'} replace />
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
