import { AxiosInstance } from 'axios';
import { Project, Todo, ApiResponse, PaginatedResponse } from '../types';

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  id: string;
}

export interface ProjectFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export class ProjectService {
  constructor(private readonly apiClient: AxiosInstance) {}

  async getProjects(
    filters: ProjectFilters = {}
  ): Promise<PaginatedResponse<Project>> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Map frontend filter names to backend parameter names
        const paramKey = key === 'limit' ? 'size' : key;
        params.append(paramKey, value.toString());
      }
    });

    const response = await this.apiClient.get<any>(
      `/api/projects?${params.toString()}`
    );

    // Backend returns ProjectListResponse format
    return {
      data: response.data.projects,
      total: response.data.total,
      page: response.data.page,
      limit: response.data.size,
      has_next: response.data.has_next,
      has_prev: response.data.has_prev,
    };
  }

  async getProjectById(
    id: string,
    includeTodos: boolean = false
  ): Promise<Project> {
    const params = includeTodos ? '?include_todos=true' : '';
    const response = await this.apiClient.get<ApiResponse<Project>>(
      `/api/projects/${id}${params}`
    );
    return response.data.data;
  }

  async createProject(project: CreateProjectRequest): Promise<Project> {
    const response = await this.apiClient.post<ApiResponse<Project>>(
      '/api/projects',
      project
    );
    return response.data.data;
  }

  async updateProject(project: UpdateProjectRequest): Promise<Project> {
    const { id, ...updateData } = project;
    const response = await this.apiClient.put<ApiResponse<Project>>(
      `/api/projects/${id}`,
      updateData
    );
    return response.data.data;
  }

  async deleteProject(id: string): Promise<void> {
    await this.apiClient.delete(`/api/projects/${id}`);
  }

  async getProjectStats(): Promise<any> {
    const response = await this.apiClient.get<ApiResponse<any>>(
      '/api/projects/stats/summary'
    );
    return response.data.data;
  }

  async getProjectTodos(
    id: string
  ): Promise<{ project: Project; todos: Todo[] }> {
    const response = await this.apiClient.get<
      ApiResponse<{ project: Project; todos: Todo[] }>
    >(`/api/projects/${id}/todos`);
    return response.data.data;
  }
}
