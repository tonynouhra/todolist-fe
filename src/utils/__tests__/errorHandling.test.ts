import {
  handleApiError,
  formatErrorMessage,
  isNetworkError,
} from '../errorHandling';

describe('Error Handling Utilities', () => {
  describe('handleApiError', () => {
    it('handles 401 unauthorized errors', () => {
      const error = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      };

      const result = handleApiError(error);
      expect(result.type).toBe('auth');
      expect(result.message).toContain('authentication');
    });

    it('handles 403 forbidden errors', () => {
      const error = {
        response: {
          status: 403,
          data: { message: 'Forbidden' },
        },
      };

      const result = handleApiError(error);
      expect(result.type).toBe('permission');
      expect(result.message).toContain('permission');
    });

    it('handles 404 not found errors', () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Not found' },
        },
      };

      const result = handleApiError(error);
      expect(result.type).toBe('notFound');
      expect(result.message).toContain('not found');
    });

    it('handles 500 server errors', () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };

      const result = handleApiError(error);
      expect(result.type).toBe('server');
      expect(result.message).toContain('server error');
    });

    it('handles network errors', () => {
      const error = {
        code: 'NETWORK_ERROR',
        message: 'Network Error',
      };

      const result = handleApiError(error);
      expect(result.type).toBe('network');
      expect(result.message).toContain('network');
    });

    it('handles unknown errors', () => {
      const error = new Error('Unknown error');

      const result = handleApiError(error);
      expect(result.type).toBe('unknown');
      expect(result.message).toContain('unexpected error');
    });
  });

  describe('formatErrorMessage', () => {
    it('formats user-friendly error messages', () => {
      const error = {
        type: 'validation' as const,
        message: 'Title is required',
        field: 'title',
      };

      const formatted = formatErrorMessage(error);
      expect(formatted).toBe('Title is required');
    });

    it('provides fallback for missing messages', () => {
      const error = {
        type: 'unknown' as const,
        message: '',
      };

      const formatted = formatErrorMessage(error);
      expect(formatted).toContain('unexpected error');
    });

    it('handles validation errors with field information', () => {
      const error = {
        type: 'validation' as const,
        message: 'Invalid email format',
        field: 'email',
      };

      const formatted = formatErrorMessage(error);
      expect(formatted).toBe('Invalid email format');
    });
  });

  describe('isNetworkError', () => {
    it('identifies network errors correctly', () => {
      const networkError = {
        code: 'NETWORK_ERROR',
        message: 'Network Error',
      };

      expect(isNetworkError(networkError)).toBe(true);
    });

    it('identifies timeout errors as network errors', () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
      };

      expect(isNetworkError(timeoutError)).toBe(true);
    });

    it('does not identify API errors as network errors', () => {
      const apiError = {
        response: {
          status: 400,
          data: { message: 'Bad request' },
        },
      };

      expect(isNetworkError(apiError)).toBe(false);
    });

    it('handles null and undefined inputs', () => {
      expect(isNetworkError(null)).toBe(false);
      expect(isNetworkError(undefined)).toBe(false);
    });
  });

  describe('Error Recovery', () => {
    it('provides retry suggestions for network errors', () => {
      const error = {
        code: 'NETWORK_ERROR',
        message: 'Network Error',
      };

      const result = handleApiError(error);
      expect(result.retryable).toBe(true);
      expect(result.suggestions).toContain('check your internet connection');
    });

    it('provides appropriate suggestions for auth errors', () => {
      const error = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      };

      const result = handleApiError(error);
      expect(result.retryable).toBe(false);
      expect(result.suggestions).toContain('sign in again');
    });

    it('provides suggestions for server errors', () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };

      const result = handleApiError(error);
      expect(result.retryable).toBe(true);
      expect(result.suggestions).toContain('try again later');
    });
  });
});
