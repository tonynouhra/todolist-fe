import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

// Create base API client
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get Clerk token from window if available
    if (typeof window !== 'undefined' && (window as any).Clerk) {
      try {
        const token = await (window as any).Clerk.session?.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error getting auth token:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // Token refresh logic would go here
      // For now, we'll just reject the promise
    }

    // Handle network errors
    if (!error.response) {
      error.message = 'Network error. Please check your connection.';
    }

    return Promise.reject(error);
  }
);

// Helper function to create authenticated API client with Clerk
export const createAuthenticatedApiClient = (
  getToken: () => Promise<string | null>
) => {
  const authenticatedClient = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor with Clerk authentication
  authenticatedClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      try {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Failed to get authentication token:', error);
        // Continue without token - let the backend handle the 401
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  authenticatedClient.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // Handle 401 errors (unauthorized)
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        // For Clerk, we don't need to refresh tokens manually
        // Clerk handles token refresh automatically
        // Just redirect to sign-in if needed
        console.warn('Authentication failed - user may need to sign in again');
      }

      // Handle network errors
      if (!error.response) {
        error.message = 'Network error. Please check your connection.';
      }

      // Enhance error messages for better UX
      if (error.response?.status === 403) {
        error.message = 'You do not have permission to perform this action.';
      } else if (error.response?.status >= 500) {
        error.message = 'Server error. Please try again later.';
      }

      return Promise.reject(error);
    }
  );

  return authenticatedClient;
};

export default apiClient;
