import { useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import {
  handleApiError,
  isAuthError,
  isNetworkError,
} from '../utils/errorHandling';
import { useAuth } from '@clerk/clerk-react';

export const useErrorHandler = () => {
  const { showError, showWarning } = useNotification();
  const { signOut } = useAuth();

  const handleError = useCallback(
    (error: unknown, customMessage?: string) => {
      const apiError = handleApiError(error);

      // Handle authentication errors
      if (isAuthError(error)) {
        showError('Your session has expired. Please log in again.');
        signOut();
        return;
      }

      // Handle network errors
      if (isNetworkError(error)) {
        showWarning(
          'Network connection issue. Please check your internet connection.'
        );
        return;
      }

      // Show custom message or API error message
      const message = customMessage || apiError.message;
      showError(message);
    },
    [showError, showWarning, signOut]
  );

  const handleSuccess = useCallback((message: string) => {
    const { showSuccess } = useNotification();
    showSuccess(message);
  }, []);

  return {
    handleError,
    handleSuccess,
  };
};
