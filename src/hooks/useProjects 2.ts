import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServices } from './useServices';
import { queryKeys } from '../services/queryClient';
import { handleApiError } from '../utils/errorHandling';
import type {
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectFilters,
} from '../services';

// Query hooks
export const useProjects = (filters: ProjectFilters = {}) => {
  const services = useServices();

  return useQuery({
    queryKey: queryKeys.projects.list(filters),
    queryFn: () => services.getProjectService().getProjects(filters),
    staleTime: 60000, // 1 minute
  });
};

export const useProject = (id: string) => {
  const services = useServices();

  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => services.getProjectService().getProjectById(id),
    enabled: !!id,
  });
};

export const useProjectStats = () => {
  const services = useServices();

  return useQuery({
    queryKey: ['project-stats'],
    queryFn: () => services.getProjectService().getProjectStats(),
    staleTime: 30000, // 30 seconds
  });
};

export const useProjectTodos = (id: string) => {
  const services = useServices();

  return useQuery({
    queryKey: [...queryKeys.projects.detail(id), 'todos'],
    queryFn: () => services.getProjectService().getProjectTodos(id),
    enabled: !!id,
    staleTime: 30000, // 30 seconds
  });
};

// Mutation hooks
export const useCreateProject = () => {
  const services = useServices();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (project: CreateProjectRequest) =>
      services.getProjectService().createProject(project),
    onSuccess: () => {
      // Invalidate and refetch projects list
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useUpdateProject = () => {
  const services = useServices();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (project: UpdateProjectRequest) =>
      services.getProjectService().updateProject(project),
    onSuccess: (updatedProject) => {
      // Update the specific project in cache
      queryClient.setQueryData(
        queryKeys.projects.detail(updatedProject.id),
        updatedProject
      );

      // Invalidate projects list to reflect changes
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useDeleteProject = () => {
  const services = useServices();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => services.getProjectService().deleteProject(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.projects.detail(deletedId),
      });

      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });

      // Invalidate todos list since project deletion might affect todos
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.lists() });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};
