import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServices } from './useServices';
import { queryKeys } from '../services/queryClient';
import { handleApiError } from '../utils/errorHandling';
import type {
  AISubtaskRequest,
  FileAnalysisRequest,
  TodoSuggestionRequest,
  TaskOptimizationRequest,
} from '../types';

// Query hooks
export const useAIServiceStatus = () => {
  const services = useServices();

  return useQuery({
    queryKey: [...queryKeys.ai.all, 'status'],
    queryFn: () => services.getAIService().getServiceStatus(),
    staleTime: 60000, // 1 minute
    retry: 2,
  });
};

// Mutation hooks
export const useGenerateSubtasks = () => {
  const services = useServices();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AISubtaskRequest) =>
      services.getAIService().generateSubtasks(request),
    onSuccess: (response, variables) => {
      // Cache the generated subtasks response
      queryClient.setQueryData(
        queryKeys.ai.subtasks(variables.todo_id),
        response
      );

      // Invalidate todos to potentially show new subtasks
      queryClient.invalidateQueries({
        queryKey: queryKeys.todos.detail(variables.todo_id),
      });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useAnalyzeFile = () => {
  const services = useServices();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: FileAnalysisRequest) =>
      services.getAIService().analyzeFile(request),
    onSuccess: (analysis, variables) => {
      // Cache the analysis result
      const cacheKey = queryKeys.ai.analysis(variables.file_name);
      queryClient.setQueryData(cacheKey, analysis);
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useGenerateTodoSuggestions = () => {
  const services = useServices();

  return useMutation({
    mutationFn: (request: TodoSuggestionRequest) =>
      services.getAIService().generateTodoSuggestions(request),
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useOptimizeTask = () => {
  const services = useServices();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: TaskOptimizationRequest) =>
      services.getAIService().optimizeTask(request),
    onSuccess: (optimizationResponse, variables) => {
      // If a todo_id was provided, update the todo in cache with optimized content
      if (variables.todo_id) {
        const todoQueryKey = queryKeys.todos.detail(variables.todo_id);
        const existingTodo = queryClient.getQueryData(todoQueryKey);

        if (existingTodo) {
          const updates: Partial<any> = {};
          if (optimizationResponse.optimized_title) {
            updates.title = optimizationResponse.optimized_title;
          }
          if (optimizationResponse.optimized_description) {
            updates.description = optimizationResponse.optimized_description;
          }

          queryClient.setQueryData(todoQueryKey, {
            ...existingTodo,
            ...updates,
          });
        }
      }
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

// Custom hook to check if AI services are available
export const useAIAvailability = () => {
  const { data: status, isLoading, error } = useAIServiceStatus();

  return {
    isAvailable: status?.service_available ?? false,
    isLoading,
    error,
    modelName: status?.model_name,
    lastRequestTimestamp: status?.last_request_timestamp,
    requestsToday: status?.requests_today,
    quotaRemaining: status?.quota_remaining,
  };
};
