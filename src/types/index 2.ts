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
