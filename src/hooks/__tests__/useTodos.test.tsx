import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTodos } from '../useTodos';
import { server } from '../../test-utils/mocks/server';
import { http, HttpResponse } from 'msw';
import React from 'react';

// Create a wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useTodos hook', () => {
  it('fetches todos successfully', async () => {
    const { result } = renderHook(() => useTodos(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.items[0].title).toBe('Test Todo');
  });

  it('handles API errors', async () => {
    server.use(
      http.get('http://localhost:8000/todos', () => {
        return HttpResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      })
    );

    const { result } = renderHook(() => useTodos(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });

  it('supports pagination parameters', async () => {
    const { result } = renderHook(() => useTodos({ page: 2, limit: 5 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data?.page).toBe(2);
    expect(result.current.data?.limit).toBe(5);
  });

  it('supports filtering parameters', async () => {
    server.use(
      http.get('http://localhost:8000/todos', ({ request }) => {
        const url = new URL(request.url);
        const status = url.searchParams.get('status');
        const priority = url.searchParams.get('priority');

        expect(status).toBe('done');
        expect(priority).toBe('5');

        return HttpResponse.json({
          items: [],
          total: 0,
          page: 1,
          limit: 10,
          pages: 0,
        });
      })
    );

    const { result } = renderHook(
      () => useTodos({ status: 'done', priority: 5 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('supports search functionality', async () => {
    server.use(
      http.get('http://localhost:8000/todos', ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get('search');

        expect(search).toBe('important');

        return HttpResponse.json({
          items: [
            {
              ...require('../../test-utils').mockTodo,
              title: 'Important Task',
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
          pages: 1,
        });
      })
    );

    const { result } = renderHook(() => useTodos({ search: 'important' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data?.items[0].title).toBe('Important Task');
  });

  it('refetches data when parameters change', async () => {
    const { result, rerender } = renderHook(({ page }) => useTodos({ page }), {
      wrapper: createWrapper(),
      initialProps: { page: 1 },
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data?.page).toBe(1);

    // Change page parameter
    rerender({ page: 2 });

    await waitFor(() => {
      expect(result.current.data?.page).toBe(2);
    });
  });

  it('provides loading and error states', async () => {
    const { result } = renderHook(() => useTodos(), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toBeUndefined();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(false);
    expect(result.current.data).toBeDefined();
  });
});
