// API Configuration
export const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Clerk Configuration
export const CLERK_PUBLISHABLE_KEY =
  process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || '';

// Application Constants
export const APP_NAME = 'TodoList';
export const APP_VERSION = '1.0.0';

// Priority Levels
export const PRIORITY_LEVELS = {
  1: { label: 'Very Low', color: '#9E9E9E' },
  2: { label: 'Low', color: '#4CAF50' },
  3: { label: 'Medium', color: '#FF9800' },
  4: { label: 'High', color: '#F44336' },
  5: { label: 'Critical', color: '#9C27B0' },
} as const;

// Todo Status
export const TODO_STATUS = {
  todo: { label: 'To Do', color: '#2196F3' },
  in_progress: { label: 'In Progress', color: '#FF9800' },
  done: { label: 'Done', color: '#4CAF50' },
} as const;

// Breakpoints (matching MUI defaults)
export const BREAKPOINTS = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
} as const;

// Re-export navigation and animation constants
export * from './navigation';
export * from './animations';
export * from './materialDesignAnimations';
