import { AxiosInstance } from 'axios';
import {
  AISubtaskRequest,
  ApiResponse,
  TodoSuggestionRequest,
  TodoSuggestionResponse,
  TaskOptimizationRequest,
  TaskOptimizationResponse,
  FileAnalysisRequest,
  FileAnalysisResponse,
  SubtaskGenerationResponse,
  AIServiceStatus,
} from '../types';

export class AIService {
  constructor(private readonly apiClient: AxiosInstance) {}

  async generateSubtasks(
    request: AISubtaskRequest
  ): Promise<SubtaskGenerationResponse> {
    const response = await this.apiClient.post<
      ApiResponse<SubtaskGenerationResponse>
    >('/api/ai/generate-subtasks', request);
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

  async generateTodoSuggestions(
    request: TodoSuggestionRequest
  ): Promise<TodoSuggestionResponse> {
    const response = await this.apiClient.post<
      ApiResponse<TodoSuggestionResponse>
    >('/api/ai/suggest-todos', request);
    return response.data.data;
  }

  async optimizeTask(
    request: TaskOptimizationRequest
  ): Promise<TaskOptimizationResponse> {
    const response = await this.apiClient.post<
      ApiResponse<TaskOptimizationResponse>
    >('/api/ai/optimize-task', request);
    return response.data.data;
  }
}
