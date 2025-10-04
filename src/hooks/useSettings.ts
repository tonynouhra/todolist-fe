/**
 * Settings Hook
 *
 * Custom hook for managing user settings with React Query and Clerk authentication.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import type { UserSettings, UserSettingsUpdate } from '../types/settings';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Custom hook for settings management with authentication
 */
export const useSettings = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  // Create authenticated axios instance
  const getAuthHeaders = async () => {
    const token = await getToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  // Fetch settings
  const {
    data: settings,
    isLoading,
    error,
  } = useQuery<UserSettings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const response = await axios.get(`${BASE_URL}/api/settings`, { headers });
      return response.data;
    },
  });

  // Update settings mutation with optimistic updates
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: UserSettingsUpdate) => {
      const headers = await getAuthHeaders();
      const response = await axios.put(`${BASE_URL}/api/settings`, updates, {
        headers,
      });
      return response.data;
    },
    onMutate: async (updates) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['settings'] });

      // Snapshot the previous value
      const previousSettings = queryClient.getQueryData<UserSettings>([
        'settings',
      ]);

      // Optimistically update to the new value
      if (previousSettings) {
        queryClient.setQueryData<UserSettings>(['settings'], {
          ...previousSettings,
          ...updates,
        });
      }

      // Return a context object with the snapshotted value
      return { previousSettings };
    },
    onError: (_err, _updates, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSettings) {
        queryClient.setQueryData(['settings'], context.previousSettings);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  // Reset settings mutation
  const resetSettingsMutation = useMutation({
    mutationFn: async () => {
      const headers = await getAuthHeaders();
      const response = await axios.post(
        `${BASE_URL}/api/settings/reset`,
        {},
        { headers }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  // Helper mutations for specific settings
  const updateTheme = async (theme: 'light' | 'dark' | 'system') => {
    return updateSettingsMutation.mutateAsync({ theme });
  };

  const updateLanguage = async (language: string) => {
    return updateSettingsMutation.mutateAsync({ language });
  };

  const updateTimezone = async (timezone: string) => {
    return updateSettingsMutation.mutateAsync({ timezone });
  };

  const updateNotifications = async (notifications: {
    notifications_enabled?: boolean;
    email_notifications?: boolean;
    push_notifications?: boolean;
  }) => {
    return updateSettingsMutation.mutateAsync(notifications);
  };

  return {
    settings,
    isLoading,
    error,
    updateSettings: updateSettingsMutation.mutateAsync,
    resetSettings: resetSettingsMutation.mutateAsync,
    updateTheme,
    updateLanguage,
    updateTimezone,
    updateNotifications,
    isUpdating: updateSettingsMutation.isPending,
    isResetting: resetSettingsMutation.isPending,
    updateError: updateSettingsMutation.error,
    resetError: resetSettingsMutation.error,
  };
};
