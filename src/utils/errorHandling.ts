import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export class AppError extends Error {
  public status?: number;
  public code?: string;
  public details?: any;

  constructor(message: string, status?: number, code?: string, details?: any) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const handleApiError = (error: unknown): ApiError => {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const data = error.response?.data;

    // Handle different error status codes
    switch (status) {
      case 400:
        return {
          message: data?.message || 'Invalid request. Please check your input.',
          status,
          code: 'BAD_REQUEST',
          details: data?.details,
        };
      case 401:
        return {
          message: 'You are not authorized. Please log in again.',
          status,
          code: 'UNAUTHORIZED',
        };
      case 403:
        return {
          message: 'You do not have permission to perform this action.',
          status,
          code: 'FORBIDDEN',
        };
      case 404:
        return {
          message: data?.message || 'The requested resource was not found.',
          status,
          code: 'NOT_FOUND',
        };
      case 409:
        return {
          message:
            data?.message ||
            'A conflict occurred. The resource may already exist.',
          status,
          code: 'CONFLICT',
        };
      case 422:
        return {
          message:
            data?.message || 'Validation failed. Please check your input.',
          status,
          code: 'VALIDATION_ERROR',
          details: data?.details,
        };
      case 429:
        return {
          message: 'Too many requests. Please try again later.',
          status,
          code: 'RATE_LIMITED',
        };
      case 500:
        return {
          message: 'An internal server error occurred. Please try again later.',
          status,
          code: 'INTERNAL_ERROR',
        };
      case 502:
      case 503:
      case 504:
        return {
          message:
            'The service is temporarily unavailable. Please try again later.',
          status,
          code: 'SERVICE_UNAVAILABLE',
        };
      default:
        return {
          message:
            data?.message || error.message || 'An unexpected error occurred.',
          status,
          code: 'UNKNOWN_ERROR',
        };
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'CLIENT_ERROR',
    };
  }

  return {
    message: 'An unknown error occurred.',
    code: 'UNKNOWN_ERROR',
  };
};

export const getErrorMessage = (error: unknown): string => {
  const apiError = handleApiError(error);
  return apiError.message;
};

export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return !error.response && error.code === 'NETWORK_ERROR';
  }
  return false;
};

export const isAuthError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return error.response?.status === 401;
  }
  return false;
};

export const isValidationError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return error.response?.status === 422;
  }
  return false;
};

export const shouldRetry = (error: unknown, attemptCount: number): boolean => {
  if (attemptCount >= 3) return false;

  if (error instanceof AxiosError) {
    const status = error.response?.status;

    // Don't retry on client errors (4xx) except for specific cases
    if (status && status >= 400 && status < 500) {
      return status === 408 || status === 429; // Timeout or rate limited
    }

    // Retry on server errors (5xx) and network errors
    return !status || status >= 500;
  }

  return false;
};
