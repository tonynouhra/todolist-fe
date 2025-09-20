import { createAuthenticatedApiClient } from './apiClient';
import { TodoService } from './todoService';
import { ProjectService } from './projectService';
import { AIService } from './aiService';
import { UserService } from './userService';

// Service factory that creates authenticated service instances
export class ServiceFactory {
  private todoService?: TodoService;
  private projectService?: ProjectService;
  private aiService?: AIService;
  private userService?: UserService;

  constructor(private getToken: () => Promise<string | null>) {}

  private getApiClient() {
    return createAuthenticatedApiClient(this.getToken);
  }

  getTodoService(): TodoService {
    if (!this.todoService) {
      this.todoService = new TodoService(this.getApiClient());
    }
    return this.todoService;
  }

  getProjectService(): ProjectService {
    if (!this.projectService) {
      this.projectService = new ProjectService(this.getApiClient());
    }
    return this.projectService;
  }

  getAIService(): AIService {
    if (!this.aiService) {
      this.aiService = new AIService(this.getApiClient());
    }
    return this.aiService;
  }

  getUserService(): UserService {
    if (!this.userService) {
      this.userService = new UserService(this.getApiClient());
    }
    return this.userService;
  }

  // Reset services (useful when token changes)
  reset(): void {
    this.todoService = undefined;
    this.projectService = undefined;
    this.aiService = undefined;
    this.userService = undefined;
  }
}

// Export service classes for direct use if needed
export { TodoService } from './todoService';
export { ProjectService } from './projectService';
export { AIService } from './aiService';
export { UserService } from './userService';

// Export types
export type {
  CreateTodoRequest,
  UpdateTodoRequest,
  TodoFilters,
} from './todoService';

export type {
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectFilters,
} from './projectService';

export type {
  FileAnalysisRequest,
  FileAnalysisResponse,
  AIServiceStatus,
} from './aiService';

// Export types from types/index.ts
export type {
  Todo,
  Project,
  AISubtaskRequest,
  GeneratedSubtask,
  ApiResponse,
  PaginatedResponse,
} from '../types';

export type {
  UserProfile,
  UpdateUserProfileRequest,
  LoginRequest,
  SignupRequest,
  AuthResponse,
} from './userService';
