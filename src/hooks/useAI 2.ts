import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServices } from './useServices';
import { queryKeys } from '../services/queryClient';
import { handleApiError } from '../utils/errorHandling';
import type {
  AISubtaskRequest,
  FileAnalysisRequest,
  GeneratedSubtask,
  FileAnalysisResponse,
  AIServiceStatus,
} from '../services';

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
    onSuccess: (subtasks, variables) => {
      // Cache the generated subtasks
      queryClient.setQueryData(
        queryKeys.ai.subtasks(variables.todo_id),
        subtasks
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
    mutationFn: (context: {
      project_id?: string;
      existing_todos?: string[];
      user_input?: string;
    }) => services.getAIService().generateTodoSuggestions(context),
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useImproveDescription = () => {
  const services = useServices();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      todoId,
      currentDescription,
    }: {
      todoId: string;
      currentDescription: string;
    }) =>
      services.getAIService().improveDescription(todoId, currentDescription),
    onSuccess: (improvedDescription, variables) => {
      // Optionally update the todo in cache with improved description
      const todoQueryKey = queryKeys.todos.detail(variables.todoId);
      const existingTodo = queryClient.getQueryData(todoQueryKey);

      if (existingTodo) {
        queryClient.setQueryData(todoQueryKey, {
          ...existingTodo,
          description: improvedDescription,
        });
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
    isAvailable: status?.available ?? false,
    isLoading,
    error,
    serviceName: status?.service_name,
    lastCheck: status?.last_check,
    errorMessage: status?.error_message,
  };
};
