import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServices } from './useServices';
import { queryKeys } from '../services/queryClient';
import { handleApiError } from '../utils/errorHandling';
import type {
  Todo,
  CreateTodoRequest,
  UpdateTodoRequest,
  TodoFilters,
} from '../services';

// Query hooks
export const useTodos = (filters: TodoFilters = {}) => {
  const services = useServices();

  return useQuery({
    queryKey: queryKeys.todos.list(filters),
    queryFn: () => services.getTodoService().getTodos(filters),
    staleTime: 30000, // 30 seconds
  });
};

export const useTodo = (id: string) => {
  const services = useServices();

  return useQuery({
    queryKey: queryKeys.todos.detail(id),
    queryFn: () => services.getTodoService().getTodoById(id),
    enabled: !!id,
  });
};

export const useSubtodos = (
  parentId: string,
  page: number = 1,
  size: number = 20
) => {
  const services = useServices();

  return useQuery({
    queryKey: [...queryKeys.todos.detail(parentId), 'subtodos', { page, size }],
    queryFn: () => services.getTodoService().getSubtodos(parentId, page, size),
    enabled: !!parentId,
  });
};

export const useTodoWithSubtasks = (id: string) => {
  const services = useServices();

  return useQuery({
    queryKey: [...queryKeys.todos.detail(id), 'with-subtasks'],
    queryFn: () => services.getTodoService().getTodoById(id, true),
    enabled: !!id,
  });
};

// Mutation hooks
export const useCreateTodo = () => {
  const services = useServices();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (todo: CreateTodoRequest) =>
      services.getTodoService().createTodo(todo),
    onSuccess: (newTodo) => {
      // Invalidate and refetch todos list
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.lists() });

      // If todo belongs to a project, invalidate project queries
      if (newTodo.project_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projects.detail(newTodo.project_id),
        });
      }

      // If this is a subtask, invalidate parent todo subtasks
      if (newTodo.parent_todo_id) {
        queryClient.invalidateQueries({
          queryKey: [
            ...queryKeys.todos.detail(newTodo.parent_todo_id),
            'subtodos',
          ],
        });
        queryClient.invalidateQueries({
          queryKey: [
            ...queryKeys.todos.detail(newTodo.parent_todo_id),
            'with-subtasks',
          ],
        });
      }
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useCreateSubtask = () => {
  const services = useServices();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      parentId,
      subtask,
    }: {
      parentId: string;
      subtask: Omit<CreateTodoRequest, 'parent_todo_id'>;
    }) =>
      services
        .getTodoService()
        .createTodo({ ...subtask, parent_todo_id: parentId }),
    onSuccess: (newSubtask, { parentId }) => {
      // Invalidate parent todo subtasks
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.todos.detail(parentId), 'subtodos'],
      });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.todos.detail(parentId), 'with-subtasks'],
      });

      // Invalidate todos list
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.lists() });

      // If subtask belongs to a project, invalidate project queries
      if (newSubtask.project_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projects.detail(newSubtask.project_id),
        });
      }
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useUpdateTodo = () => {
  const services = useServices();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (todo: UpdateTodoRequest) =>
      services.getTodoService().updateTodo(todo),
    onSuccess: (updatedTodo) => {
      // Update the specific todo in cache
      queryClient.setQueryData(
        queryKeys.todos.detail(updatedTodo.id),
        updatedTodo
      );

      // Invalidate todos list to reflect changes
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.lists() });

      // If todo belongs to a project, invalidate project queries
      if (updatedTodo.project_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projects.detail(updatedTodo.project_id),
        });
      }
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

// Hook to get subtask count for a todo
export const useSubtaskCount = (parentId: string) => {
  const { data: subtodos } = useSubtodos(parentId, 1, 1);
  return subtodos?.total || 0;
};

export const useDeleteTodo = () => {
  const services = useServices();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (todoData: { id: string; parentId?: string } | string) => {
      // Support both new format and legacy format for backward compatibility
      const id = typeof todoData === 'string' ? todoData : todoData.id;
      return services.getTodoService().deleteTodo(id);
    },
    onSuccess: (_, variables) => {
      const { id: deletedId, parentId } =
        typeof variables === 'string'
          ? { id: variables, parentId: undefined }
          : variables;

      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.todos.detail(deletedId),
      });

      // Invalidate todos list
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.lists() });

      // If this was a subtask, invalidate parent todo
      if (parentId) {
        queryClient.invalidateQueries({
          queryKey: [...queryKeys.todos.detail(parentId), 'subtodos'],
        });
        queryClient.invalidateQueries({
          queryKey: [...queryKeys.todos.detail(parentId), 'with-subtasks'],
        });
      }

      // Invalidate all projects (since we don't know which project it belonged to)
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useToggleTodoStatus = () => {
  const services = useServices();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => services.getTodoService().toggleTodoStatus(id),
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.todos.detail(id) });

      // Snapshot the previous value
      const previousTodo = queryClient.getQueryData<Todo>(
        queryKeys.todos.detail(id)
      );

      // Optimistically update to the new value
      if (previousTodo) {
        const newStatus = previousTodo.status === 'done' ? 'todo' : 'done';
        queryClient.setQueryData(queryKeys.todos.detail(id), {
          ...previousTodo,
          status: newStatus,
          completed_at: newStatus === 'done' ? new Date().toISOString() : null,
        });
      }

      // Return a context object with the snapshotted value
      return { previousTodo };
    },
    onError: (error, id, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTodo) {
        queryClient.setQueryData(
          queryKeys.todos.detail(id),
          context.previousTodo
        );
      }
      const apiError = handleApiError(error);
      throw apiError;
    },
    onSettled: (updatedTodo, error, id) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.lists() });

      if (updatedTodo?.project_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projects.detail(updatedTodo.project_id),
        });
      }
    },
  });
};
