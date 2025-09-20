# API Integration Documentation

## Overview

This document describes the API integration layer implementation for the todolist frontend application. The integration layer provides a robust, type-safe, and efficient way to communicate with the backend API using Axios for HTTP requests and React Query for state management.

**🔧 Recent Updates**: All API services have been updated to use the correct backend endpoints with `/api/` prefix to match the FastAPI backend structure. Parameter mapping and response format handling have been corrected for proper integration.

## Architecture

### Core Components

1. **API Client** (`src/services/apiClient.ts`)
   - Configured Axios instance with authentication interceptors
   - Request/response interceptors for error handling
   - Automatic token injection for authenticated requests

2. **React Query Configuration** (`src/services/queryClient.ts`)
   - Centralized query client with optimized defaults
   - Query key factory for consistent cache management
   - Retry logic and error handling configuration

3. **Service Classes** (`src/services/`)
   - Domain-specific service classes (Todo, Project, AI, User)
   - Type-safe API methods with proper error handling
   - Consistent request/response patterns

4. **React Query Hooks** (`src/hooks/`)
   - Custom hooks for queries and mutations
   - Optimistic updates and cache management
   - Error handling integration

## API Client Configuration

### Base Configuration

```typescript
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Authentication Integration

The API client integrates with Clerk authentication through the `createAuthenticatedApiClient` factory function:

```typescript
const authenticatedClient = createAuthenticatedApiClient(getToken);
```

**Key Features:**
- Automatic token injection in request headers
- Token refresh handling on 401 responses
- Request retry logic for transient failures

### Request/Response Interceptors

**Request Interceptor:**
- Adds Bearer token to Authorization header
- Handles token retrieval from Clerk

**Response Interceptor:**
- Handles 401 errors with automatic retry
- Provides user-friendly error messages for network issues
- Standardizes error response format

## React Query Configuration

### Default Options

```typescript
{
  queries: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    retry: (failureCount, error) => {
      // Smart retry logic based on error type
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
  mutations: {
    retry: (failureCount, error) => {
      // No retry on 4xx errors, retry on 5xx and network errors
    },
  }
}
```

### Query Key Factory

Centralized query key management ensures consistent cache invalidation:

```typescript
export const queryKeys = {
  todos: {
    all: ['todos'],
    lists: () => [...queryKeys.todos.all, 'list'],
    list: (filters) => [...queryKeys.todos.lists(), filters],
    details: () => [...queryKeys.todos.all, 'detail'],
    detail: (id) => [...queryKeys.todos.details(), id],
  },
  // ... other domains
};
```

## Service Classes

### Service Architecture

Each domain has a dedicated service class that encapsulates API operations:

- `TodoService` - CRUD operations for todos
- `ProjectService` - Project management operations
- `AIService` - AI-powered features
- `UserService` - User profile and settings

### Example Service Implementation

```typescript
export class TodoService {
  constructor(private apiClient: AxiosInstance) {}

  async getTodos(filters: TodoFilters = {}): Promise<PaginatedResponse<Todo>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await this.apiClient.get<PaginatedResponse<Todo>>(
      `/todos?${params.toString()}`
    );
    return response.data;
  }
  
  // ... other methods
}
```

### Service Factory

The `ServiceFactory` class provides authenticated service instances:

```typescript
export class ServiceFactory {
  constructor(private getToken: () => Promise<string | null>) {}
  
  getTodoService(): TodoService {
    if (!this.todoService) {
      this.todoService = new TodoService(this.getApiClient());
    }
    return this.todoService;
  }
  
  // ... other service getters
}
```

## React Query Hooks

### Query Hooks

Custom hooks provide a clean interface for data fetching:

```typescript
export const useTodos = (filters: TodoFilters = {}) => {
  const services = useServices();
  
  return useQuery({
    queryKey: queryKeys.todos.list(filters),
    queryFn: () => services.getTodoService().getTodos(filters),
    staleTime: 30000,
  });
};
```

### Mutation Hooks

Mutation hooks handle data modifications with optimistic updates:

```typescript
export const useToggleTodoStatus = () => {
  const services = useServices();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => services.getTodoService().toggleTodoStatus(id),
    onMutate: async (id) => {
      // Optimistic update logic
      await queryClient.cancelQueries({ queryKey: queryKeys.todos.detail(id) });
      const previousTodo = queryClient.getQueryData(queryKeys.todos.detail(id));
      
      if (previousTodo) {
        queryClient.setQueryData(queryKeys.todos.detail(id), {
          ...previousTodo,
          status: previousTodo.status === 'done' ? 'todo' : 'done',
        });
      }
      
      return { previousTodo };
    },
    onError: (error, id, context) => {
      // Rollback on error
      if (context?.previousTodo) {
        queryClient.setQueryData(queryKeys.todos.detail(id), context.previousTodo);
      }
    },
    onSettled: (updatedTodo, error, id) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.detail(id) });
    },
  });
};
```

## Error Handling

### Error Types and Handling

The error handling system provides comprehensive error management:

```typescript
export const handleApiError = (error: unknown): ApiError => {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    
    switch (status) {
      case 400:
        return { message: 'Invalid request', status, code: 'BAD_REQUEST' };
      case 401:
        return { message: 'Unauthorized', status, code: 'UNAUTHORIZED' };
      case 404:
        return { message: 'Resource not found', status, code: 'NOT_FOUND' };
      // ... other status codes
    }
  }
  
  return { message: 'Unknown error', code: 'UNKNOWN_ERROR' };
};
```

### Retry Logic

Smart retry logic based on error types:

- **4xx errors**: No retry (except 408, 429)
- **5xx errors**: Retry with exponential backoff
- **Network errors**: Retry with exponential backoff
- **Maximum retries**: 3 for queries, 2 for mutations

### Error Boundary Integration

Global error boundary catches unhandled errors:

```typescript
export class ErrorBoundary extends Component<Props, State> {
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }
  
  // ... render error UI
}
```

## Notification System

### Notification Context

Centralized notification system for user feedback:

```typescript
interface NotificationContextType {
  showNotification: (message: string, severity?: AlertColor, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}
```

### Error Handler Hook

Combines error handling with notifications:

```typescript
export const useErrorHandler = () => {
  const { showError, showWarning } = useNotification();
  const { signOut } = useAuth();

  const handleError = useCallback((error: unknown, customMessage?: string) => {
    const apiError = handleApiError(error);
    
    if (isAuthError(error)) {
      showError('Session expired. Please log in again.');
      signOut();
      return;
    }
    
    if (isNetworkError(error)) {
      showWarning('Network connection issue.');
      return;
    }
    
    showError(customMessage || apiError.message);
  }, [showError, showWarning, signOut]);
};
```

## Usage Examples

### Basic Query Usage

```typescript
const TodoList: React.FC = () => {
  const { data: todos, isLoading, error } = useTodos({ status: 'todo' });
  
  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">Failed to load todos</Alert>;
  
  return (
    <div>
      {todos?.data.map(todo => (
        <TodoCard key={todo.id} todo={todo} />
      ))}
    </div>
  );
};
```

### Mutation with Error Handling

```typescript
const CreateTodoForm: React.FC = () => {
  const createTodo = useCreateTodo();
  const { handleError, handleSuccess } = useErrorHandler();
  
  const handleSubmit = async (data: CreateTodoRequest) => {
    try {
      await createTodo.mutateAsync(data);
      handleSuccess('Todo created successfully!');
    } catch (error) {
      handleError(error, 'Failed to create todo');
    }
  };
  
  // ... form implementation
};
```

### Service Integration

```typescript
const useServices = () => {
  const { getToken } = useAuth();
  
  const services = useMemo(() => {
    return new ServiceFactory(getToken);
  }, [getToken]);
  
  return services;
};
```

## Performance Optimizations

### Caching Strategy

- **Stale-while-revalidate**: Data remains fresh for 5 minutes
- **Background refetching**: Automatic updates on window focus/reconnect
- **Garbage collection**: Unused data cleaned after 10 minutes

### Optimistic Updates

Critical user interactions (like toggling todo status) use optimistic updates for immediate feedback:

1. Update UI immediately
2. Send request to server
3. Rollback on error
4. Refetch to ensure consistency

### Request Deduplication

React Query automatically deduplicates identical requests, preventing unnecessary API calls.

## Testing Considerations

### Mock Service Worker (MSW)

API integration testing uses MSW for request mocking:

```typescript
// Mock handlers for testing
export const handlers = [
  rest.get('/todos', (req, res, ctx) => {
    return res(ctx.json({ data: mockTodos }));
  }),
  // ... other handlers
];
```

### Hook Testing

Custom hooks are tested using React Testing Library:

```typescript
const { result } = renderHook(() => useTodos(), {
  wrapper: createWrapper(),
});

await waitFor(() => {
  expect(result.current.isSuccess).toBe(true);
});
```

## Security Considerations

### Token Management

- Tokens are managed by Clerk and automatically injected
- No token storage in localStorage or sessionStorage
- Automatic token refresh on expiration

### Request Validation

- All requests include proper Content-Type headers
- Request/response data is validated using TypeScript types
- Sensitive data is never logged in production

### CORS and CSP

- API client respects CORS policies
- Content Security Policy headers are properly configured
- No inline scripts or unsafe evaluations

## Monitoring and Debugging

### Development Tools

- React Query DevTools for cache inspection
- Axios request/response logging in development
- Error boundary with detailed error information

### Production Monitoring

- Error tracking integration ready
- Performance metrics collection
- API response time monitoring

## Future Enhancements

### Planned Improvements

1. **Offline Support**: Service worker integration for offline functionality
2. **Real-time Updates**: WebSocket integration for live data updates
3. **Advanced Caching**: More sophisticated cache invalidation strategies
4. **Request Batching**: Batch multiple requests for better performance

### Extensibility

The architecture is designed to be easily extensible:

- New service classes can be added following the same pattern
- Additional error types can be handled in the error handling system
- New React Query hooks can be created using existing patterns

## Conclusion

The API integration layer provides a robust foundation for the todolist frontend application. It combines the power of Axios for HTTP requests with React Query for state management, resulting in a type-safe, performant, and user-friendly data layer.

Key benefits:

- **Type Safety**: Full TypeScript integration
- **Performance**: Intelligent caching and optimistic updates
- **User Experience**: Comprehensive error handling and notifications
- **Developer Experience**: Clean APIs and debugging tools
- **Maintainability**: Modular architecture and consistent patterns