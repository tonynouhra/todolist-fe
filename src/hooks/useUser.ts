import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServices } from './useServices';
import { queryKeys } from '../services/queryClient';
import { handleApiError } from '../utils/errorHandling';
import type { UserProfile, UpdateUserProfileRequest } from '../services';

// Query hooks
export const useUserProfile = () => {
  const services = useServices();

  return useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: () => services.getUserService().getCurrentUser(),
    staleTime: 300000, // 5 minutes
  });
};

// Mutation hooks
export const useUpdateUserProfile = () => {
  const services = useServices();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: UpdateUserProfileRequest) =>
      services.getUserService().updateProfile(updates),
    onSuccess: (updatedProfile) => {
      // Update the profile in cache
      queryClient.setQueryData(queryKeys.user.profile(), updatedProfile);
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};
