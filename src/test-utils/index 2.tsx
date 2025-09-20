import React, { ReactElement } from 'react';
import {
  render,
  RenderOptions,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { theme } from '../styles/theme';
import { NotificationProvider } from '../contexts/NotificationContext';

// Mock Clerk provider for testing
const MockClerkProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <div data-testid="mock-clerk-provider">{children}</div>;
};

// Create a custom render function that includes providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <NotificationProvider>
            <MockClerkProvider>{children}</MockClerkProvider>
          </NotificationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Mock data generators
export const mockTodo = {
  id: '1',
  user_id: 'user_1',
  project_id: 'project_1',
  title: 'Test Todo',
  description: 'Test Description',
  status: 'todo' as const,
  priority: 3,
  due_date: '2024-12-31T23:59:59Z',
  ai_generated: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockProject = {
  id: 'project_1',
  user_id: 'user_1',
  name: 'Test Project',
  description: 'Test Project Description',
  todo_count: 5,
  completed_todo_count: 2,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockUser = {
  id: 'user_1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
};

// Custom matchers for better assertions
export const customMatchers = {
  toBeInTheDocument: expect.objectContaining({
    toBeInTheDocument: expect.any(Function),
  }),
};

// Test utilities for common testing patterns
export const waitForLoadingToFinish = () => {
  return waitFor(() => {
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
};

export const expectElementToBeAccessible = async (element: HTMLElement) => {
  // Check for basic accessibility attributes
  if (element.tagName === 'BUTTON') {
    expect(element).toHaveAttribute('type');
  }

  if (element.getAttribute('role') === 'dialog') {
    expect(element).toHaveAttribute('aria-labelledby');
    expect(element).toHaveAttribute('aria-describedby');
  }

  // Check for proper labeling
  const hasLabel =
    element.getAttribute('aria-label') ||
    element.getAttribute('aria-labelledby') ||
    element.querySelector('label');

  if (!hasLabel && element.tagName !== 'DIV') {
    console.warn(`Element ${element.tagName} may need accessibility labeling`);
  }
};

export const simulateKeyboardNavigation = (
  element: HTMLElement,
  key: string
) => {
  fireEvent.keyDown(element, { key, code: key });
  fireEvent.keyUp(element, { key, code: key });
};

export const createMockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.IntersectionObserver = mockIntersectionObserver;
  return mockIntersectionObserver;
};

export const createMockResizeObserver = () => {
  const mockResizeObserver = jest.fn();
  mockResizeObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.ResizeObserver = mockResizeObserver;
  return mockResizeObserver;
};
