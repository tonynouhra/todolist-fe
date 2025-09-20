import { AxiosInstance } from 'axios';
import { Todo, ApiResponse, PaginatedResponse } from '../types';

export interface CreateTodoRequest {
  title: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'done';
  priority?: 1 | 2 | 3 | 4 | 5;
  due_date?: string;
  project_id?: string;
  parent_todo_id?: string;
}

export interface UpdateTodoRequest extends Partial<CreateTodoRequest> {
  id: string;
}

export interface TodoFilters {
  status?: 'todo' | 'in_progress' | 'done';
  priority?: 1 | 2 | 3 | 4 | 5;
  project_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class TodoService {
  constructor(private readonly apiClient: AxiosInstance) {}

  async getTodos(filters: TodoFilters = {}): Promise<PaginatedResponse<Todo>> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Map frontend filter names to backend parameter names
        const paramKey = key === 'limit' ? 'size' : key;
        params.append(paramKey, value.toString());
      }
    });

    const response = await this.apiClient.get<any>(
      `/api/todos?${params.toString()}`
    );

    // Backend returns TodoListResponse format
    return {
      data: response.data.todos,
      total: response.data.total,
      page: response.data.page,
      limit: response.data.size,
      has_next: response.data.has_next,
      has_prev: response.data.has_prev,
    };
  }

  async getTodoById(
    id: string,
    includeSubtasks: boolean = false
  ): Promise<Todo> {
    const params = includeSubtasks ? '?include_subtasks=true' : '';
    const response = await this.apiClient.get<ApiResponse<Todo>>(
      `/api/todos/${id}${params}`
    );
    return response.data.data;
  }

  async createTodo(todo: CreateTodoRequest): Promise<Todo> {
    const response = await this.apiClient.post<ApiResponse<Todo>>(
      '/api/todos',
      todo
    );
    return response.data.data;
  }

  async updateTodo(todo: UpdateTodoRequest): Promise<Todo> {
    const { id, ...updateData } = todo;
    const response = await this.apiClient.put<ApiResponse<Todo>>(
      `/api/todos/${id}`,
      updateData
    );
    return response.data.data;
  }

  async deleteTodo(id: string): Promise<void> {
    await this.apiClient.delete(`/api/todos/${id}`);
  }

  async toggleTodoStatus(id: string): Promise<Todo> {
    const response = await this.apiClient.patch<ApiResponse<Todo>>(
      `/api/todos/${id}/toggle-status`
    );
    return response.data.data;
  }

  async getTodosByProject(
    projectId: string,
    filters: Omit<TodoFilters, 'project_id'> = {}
  ): Promise<PaginatedResponse<Todo>> {
    return this.getTodos({ ...filters, project_id: projectId });
  }

  async getSubtodos(
    parentId: string,
    page: number = 1,
    size: number = 20
  ): Promise<PaginatedResponse<Todo>> {
    const response = await this.apiClient.get<any>(
      `/api/todos/${parentId}/subtasks?page=${page}&size=${size}`
    );

    // Backend returns TodoListResponse format
    return {
      data: response.data.todos,
      total: response.data.total,
      page: response.data.page,
      limit: response.data.size,
      has_next: response.data.has_next,
      has_prev: response.data.has_prev,
    };
  }

  async getTodoStats(): Promise<any> {
    const response = await this.apiClient.get<ApiResponse<any>>(
      '/api/todos/stats/summary'
    );
    return response.data.data;
  }
}
