// Todo Types
export interface Todo {
  id: string;
  user_id: string;
  project_id?: string;
  parent_todo_id?: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 1 | 2 | 3 | 4 | 5;
  due_date?: string;
  completed_at?: string;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

// Project Types
export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  todo_count?: number;
  completed_todo_count?: number;
  created_at: string;
  updated_at: string;
}

// AI Types
export interface AISubtaskRequest {
  todo_id: string;
  min_subtasks: number;
  max_subtasks: number;
}

export interface GeneratedSubtask {
  title: string;
  description?: string;
  priority: number;
  estimated_time?: string;
  order: number;
}

export interface TodoSuggestionRequest {
  project_id?: string;
  user_input: string;
  existing_todos?: string[];
  max_todos?: number;
}

export interface GeneratedTodo {
  title: string;
  description?: string;
  priority: number;
  estimated_time?: string;
  category?: string;
}

export interface TodoSuggestionResponse {
  request_description: string;
  generated_todos: GeneratedTodo[];
  total_todos: number;
  generation_timestamp: string;
  ai_model: string;
}

export interface TaskOptimizationRequest {
  todo_id?: string;
  current_title?: string;
  current_description?: string;
  optimization_type: 'description' | 'title' | 'both' | 'clarity' | 'detail';
  context?: string;
}

export interface TaskOptimizationResponse {
  original_title?: string;
  original_description?: string;
  optimized_title?: string;
  optimized_description?: string;
  optimization_type: string;
  improvements: string[];
  optimization_timestamp: string;
  ai_model: string;
}

export interface FileAnalysisRequest {
  file_id: string;
  analysis_type?: 'general' | 'task_extraction' | 'summary';
  context?: string;
}

export interface FileAnalysisResponse {
  file_id: string;
  analysis_type: string;
  summary: string;
  key_points: string[];
  suggested_tasks: string[];
  confidence_score: number;
  analysis_timestamp: string;
  ai_model: string;
}

export interface SubtaskGenerationResponse {
  parent_task_title: string;
  generated_subtasks: GeneratedSubtask[];
  total_subtasks: number;
  generation_timestamp: string;
  ai_model: string;
}

export interface AIServiceStatus {
  service_available: boolean;
  model_name: string;
  last_request_timestamp?: string;
  requests_today: number;
  quota_remaining?: number;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}
