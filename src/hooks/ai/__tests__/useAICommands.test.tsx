import { renderHook, act } from '@testing-library/react';
import { AICommandParser } from '../../../utils/ai/commandParser';
import { useAICommands } from '../useAICommands';
import type { UseAIChatReturn } from '../useAIChat';
import type { Todo } from '../../../types';

const mockGenerateSubtasks = jest.fn();
const mockGenerateTodos = jest.fn();
const mockOptimizeTask = jest.fn();

jest.mock('../../useAI', () => ({
  useGenerateSubtasks: () => ({ mutateAsync: mockGenerateSubtasks }),
  useGenerateTodoSuggestions: () => ({ mutateAsync: mockGenerateTodos }),
  useOptimizeTask: () => ({ mutateAsync: mockOptimizeTask }),
}));

const createMockChat = (): UseAIChatReturn => ({
  messages: [],
  isLoading: false,
  error: null,
  messagesEndRef: { current: null },
  scrollToBottom: jest.fn(),
  addMessage: jest.fn().mockReturnValue('loading-message'),
  addUserMessage: jest.fn(),
  addAIMessage: jest.fn(),
  addSystemMessage: jest.fn(),
  updateMessage: jest.fn(),
  clearChat: jest.fn(),
  setLoading: jest.fn(),
  setError: jest.fn(),
  sessions: [
    {
      id: 'session-1',
      title: 'Conversation 1',
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 0,
    },
  ],
  activeSessionId: 'session-1',
  startNewSession: jest.fn(),
  switchSession: jest.fn(),
});

const parser = new AICommandParser();

const sampleTodos: Todo[] = [
  {
    id: 'todo-1',
    user_id: 'user-1',
    title: 'Plan Vacation',
    description: 'Organize the summer trip',
    status: 'todo',
    priority: 3,
    ai_generated: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useAICommands', () => {
  it('matches todo titles when generating subtasks', async () => {
    const mockChat = createMockChat();

    mockGenerateSubtasks.mockResolvedValue({
      parent_task_title: 'Plan Vacation',
      generated_subtasks: [
        { title: 'Book flights', order: 1, priority: 3 },
        { title: 'Reserve hotel', order: 2, priority: 3 },
      ],
      total_subtasks: 2,
      generation_timestamp: '2024-01-01T00:00:00Z',
      ai_model: 'gemini-pro',
    });

    const { result } = renderHook(() =>
      useAICommands({ chat: mockChat, parser, todos: sampleTodos })
    );

    await act(async () => {
      await result.current.executeCommand(
        'Break down Plan Vacation into subtasks'
      );
    });

    expect(mockGenerateSubtasks).toHaveBeenCalledWith({
      todo_id: 'todo-1',
      min_subtasks: 3,
      max_subtasks: 5,
    });

    expect(mockChat.addAIMessage).toHaveBeenCalledWith(
      expect.stringContaining("I've generated"),
      expect.objectContaining({ type: 'subtasks' })
    );
  });

  it('falls back to todo suggestions for free-form prompts', async () => {
    const mockChat = createMockChat();

    mockGenerateTodos.mockResolvedValue({
      request_description: 'Plan a birthday party',
      generated_todos: [
        { title: 'Create guest list', priority: 3 },
        { title: 'Order cake', priority: 3 },
      ],
      total_todos: 2,
      generation_timestamp: '2024-01-01T00:00:00Z',
      ai_model: 'gemini-pro',
    });

    const { result } = renderHook(() =>
      useAICommands({ chat: mockChat, parser, todos: sampleTodos })
    );

    await act(async () => {
      await result.current.executeCommand('Help me plan a birthday party');
    });

    expect(mockGenerateTodos).toHaveBeenCalledWith({
      user_input: 'Help me plan a birthday party',
      project_id: undefined,
      existing_todos: ['Plan Vacation'],
    });

    expect(mockChat.addAIMessage).toHaveBeenCalledWith(
      expect.stringContaining('Here are 2 todo suggestions'),
      expect.objectContaining({ type: 'todo_suggestions' })
    );
  });
});
