import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServices } from './useServices';
import { queryKeys } from '../services/queryClient';
import { handleApiError } from '../utils/errorHandling';
import type {
  Todo,
  CreateTodoRequest,
  UpdateTodoRequest,
  TodoFilters,
  PaginatedResponse,
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

      // Capture list/subtask queries for optimistic updates
      const listQueries = queryClient.getQueriesData<PaginatedResponse<Todo>>({
        queryKey: queryKeys.todos.lists(),
      });
      const subtaskQueries = queryClient.getQueriesData<
        PaginatedResponse<Todo>
      >({
        predicate: (query) =>
          Array.isArray(query.queryKey) && query.queryKey.includes('subtodos'),
      });
      const withSubtasksQueries = queryClient.getQueriesData<any>({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey.includes('with-subtasks'),
      });

      let targetTodo: Todo | undefined = previousTodo;

      if (!targetTodo) {
        for (const [, data] of listQueries) {
          if (!data) continue;
          const match = data.data.find((todoItem) => todoItem.id === id);
          if (match) {
            targetTodo = match;
            break;
          }
        }
      }

      if (!targetTodo) {
        for (const [, data] of subtaskQueries) {
          if (!data) continue;
          const match = data.data.find((todoItem) => todoItem.id === id);
          if (match) {
            targetTodo = match;
            break;
          }
        }
      }

      // Optimistically update to the new value
      let newStatus: Todo['status'] | undefined;
      if (targetTodo) {
        newStatus = targetTodo.status === 'done' ? 'todo' : 'done';

        const completedAt =
          newStatus === 'done' ? new Date().toISOString() : null;

        queryClient.setQueryData(queryKeys.todos.detail(id), {
          ...targetTodo,
          status: newStatus,
          completed_at: completedAt,
        });

        const previousLists: Array<{
          key: readonly unknown[];
          data: PaginatedResponse<Todo>;
        }> = [];
        listQueries.forEach(([key, data]) => {
          if (!data) return;
          const itemIndex = data.data.findIndex(
            (todoItem) => todoItem.id === id
          );
          if (itemIndex === -1) return;
          previousLists.push({ key, data });
          const updatedList: PaginatedResponse<Todo> = {
            ...data,
            data: data.data.map((todoItem, index) => {
              if (index !== itemIndex) {
                return todoItem;
              }
              return {
                ...todoItem,
                status: newStatus!,
                completed_at: completedAt,
              };
            }),
          };
          queryClient.setQueryData(key, updatedList);
        });

        const previousSubtasks: Array<{
          key: readonly unknown[];
          data: PaginatedResponse<Todo>;
        }> = [];
        subtaskQueries.forEach(([key, data]) => {
          if (!data) return;
          const itemIndex = data.data.findIndex(
            (todoItem) => todoItem.id === id
          );
          if (itemIndex === -1) return;
          previousSubtasks.push({ key, data });
          const updatedSubtasks: PaginatedResponse<Todo> = {
            ...data,
            data: data.data.map((todoItem, index) => {
              if (index !== itemIndex) {
                return todoItem;
              }
              return {
                ...todoItem,
                status: newStatus!,
                completed_at: completedAt,
              };
            }),
          };
          queryClient.setQueryData(key, updatedSubtasks);
        });

        const previousWithSubtasks: Array<{
          key: readonly unknown[];
          data: any;
        }> = [];
        withSubtasksQueries.forEach(([key, data]) => {
          if (!data || !Array.isArray(data?.subtasks)) return;
          const itemIndex = data.subtasks.findIndex(
            (todoItem: Todo) => todoItem.id === id
          );
          if (itemIndex === -1) return;
          previousWithSubtasks.push({ key, data });
          const updatedParent = {
            ...data,
            subtasks: data.subtasks.map((todoItem: Todo, index: number) =>
              index === itemIndex
                ? {
                    ...todoItem,
                    status: newStatus!,
                    completed_at: completedAt,
                  }
                : todoItem
            ),
          };
          queryClient.setQueryData(key, updatedParent);
        });

        return {
          previousTodo,
          previousLists,
          previousSubtasks,
          previousWithSubtasks,
        };
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
      context?.previousLists?.forEach(({ key, data }) => {
        queryClient.setQueryData(key, data);
      });
      context?.previousSubtasks?.forEach(({ key, data }) => {
        queryClient.setQueryData(key, data);
      });
      context?.previousWithSubtasks?.forEach(({ key, data }) => {
        queryClient.setQueryData(key, data);
      });
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

      if (updatedTodo?.parent_todo_id) {
        queryClient.invalidateQueries({
          queryKey: [
            ...queryKeys.todos.detail(updatedTodo.parent_todo_id),
            'subtodos',
          ],
        });
        queryClient.invalidateQueries({
          queryKey: [
            ...queryKeys.todos.detail(updatedTodo.parent_todo_id),
            'with-subtasks',
          ],
        });
      }
    },
  });
};
