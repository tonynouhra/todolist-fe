import { AxiosInstance } from 'axios';
import { AISubtaskRequest, GeneratedSubtask, ApiResponse } from '../types';

export interface FileAnalysisRequest {
  file_content: string;
  file_name: string;
  analysis_type?: 'todo_extraction' | 'summary' | 'suggestions';
}

export interface FileAnalysisResponse {
  analysis: string;
  suggested_todos?: GeneratedSubtask[];
  summary?: string;
  recommendations?: string[];
}

export interface AIServiceStatus {
  available: boolean;
  service_name: string;
  last_check: string;
  error_message?: string;
}

export class AIService {
  constructor(private readonly apiClient: AxiosInstance) {}

  async generateSubtasks(
    request: AISubtaskRequest
  ): Promise<GeneratedSubtask[]> {
    const response = await this.apiClient.post<ApiResponse<GeneratedSubtask[]>>(
      '/api/ai/generate-subtasks',
      request
    );
    return response.data.data;
  }

  async analyzeFile(
    request: FileAnalysisRequest
  ): Promise<FileAnalysisResponse> {
    const response = await this.apiClient.post<
      ApiResponse<FileAnalysisResponse>
    >('/api/ai/analyze-file', request);
    return response.data.data;
  }

  async getServiceStatus(): Promise<AIServiceStatus> {
    const response =
      await this.apiClient.get<ApiResponse<AIServiceStatus>>('/api/ai/status');
    return response.data.data;
  }

  // Note: These endpoints may not exist in the backend yet
  // They are kept for future implementation
  async generateTodoSuggestions(context: {
    project_id?: string;
    existing_todos?: string[];
    user_input?: string;
  }): Promise<GeneratedSubtask[]> {
    const response = await this.apiClient.post<ApiResponse<GeneratedSubtask[]>>(
      '/api/ai/suggest-todos',
      context
    );
    return response.data.data;
  }

  async improveDescription(
    todoId: string,
    currentDescription: string
  ): Promise<string> {
    const response = await this.apiClient.post<
      ApiResponse<{ improved_description: string }>
    >('/api/ai/improve-description', {
      todo_id: todoId,
      current_description: currentDescription,
    });
    return response.data.data.improved_description;
  }
}
