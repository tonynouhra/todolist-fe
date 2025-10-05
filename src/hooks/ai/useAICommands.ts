import { useCallback, useMemo } from 'react';
import { AICommandParser, AICommand } from '../../utils/ai/commandParser';
import {
  useGenerateSubtasks,
  useGenerateTodoSuggestions,
  useOptimizeTask,
} from '../useAI';
import { UseAIChatReturn } from './useAIChat';
import type { GeneratedSubtask, GeneratedTodo, Todo } from '../../types';

interface UseAICommandsProps {
  chat: UseAIChatReturn;
  parser: AICommandParser;
  todos: Todo[];
}

export interface UseAICommandsReturn {
  executeCommand: (input: string, file?: File) => Promise<void>;
}

export const useAICommands = ({
  chat,
  parser,
  todos,
}: UseAICommandsProps): UseAICommandsReturn => {
  const generateSubtasksMutation = useGenerateSubtasks();
  const generateTodosMutation = useGenerateTodoSuggestions();
  const optimizeTaskMutation = useOptimizeTask();

  const indexedTodos = useMemo(() => {
    const byTitle = new Map<string, Todo>();
    const byId = new Map<string, Todo>();

    todos.forEach((todo) => {
      byId.set(todo.id, todo);
      byTitle.set(todo.title.toLowerCase(), todo);
    });

    return { byTitle, byId };
  }, [todos]);

  const findTodoMatch = useCallback(
    (todoId?: string, todoTitle?: string): Todo | undefined => {
      if (todoId) {
        const matchById = indexedTodos.byId.get(todoId);
        if (matchById) return matchById;
      }

      if (todoTitle) {
        const normalized = todoTitle.trim().toLowerCase();
        const direct = indexedTodos.byTitle.get(normalized);
        if (direct) return direct;

        const partial = todos.find((todo) => {
          const lowerTitle = todo.title.toLowerCase();
          return (
            lowerTitle.includes(normalized) || normalized.includes(lowerTitle)
          );
        });
        if (partial) return partial;
      }

      return undefined;
    },
    [indexedTodos, todos]
  );

  const handleAnalyzeFile = useCallback(() => {
    chat.addAIMessage(
      'File analysis requires files stored in the workspace. Upload a file from the Files section and try again.'
    );
  }, [chat]);

  const handleGenerateSubtasks = useCallback(
    async (command: AICommand) => {
      try {
        const { todoId, todoTitle } = command.parameters;
        const todo = findTodoMatch(todoId, todoTitle);

        if (!todo) {
          chat.addAIMessage(
            "I couldn't find that todo. Try referencing it by the exact title or open it and ask again."
          );
          return;
        }

        const response = await generateSubtasksMutation.mutateAsync({
          todo_id: todo.id,
          min_subtasks: 3,
          max_subtasks: 5,
        });

        chat.addAIMessage(
          `I've generated ${response.generated_subtasks.length} subtasks for "${response.parent_task_title}".`,
          {
            type: 'subtasks',
            parentTaskTitle: response.parent_task_title,
            subtasks: response.generated_subtasks as GeneratedSubtask[],
            autoCreated: true,
          }
        );

        const suggestions = parser.getSuggestions(command);
        if (suggestions.length) {
          chat.addSystemMessage(`Suggestions: ${suggestions.join(' • ')}`);
        }
      } catch (error) {
        console.error('generate_subtasks failed', error);
        chat.addAIMessage(
          'The AI service could not generate subtasks right now. Please try again later.'
        );
      }
    },
    [chat, findTodoMatch, generateSubtasksMutation, parser]
  );

  const handleGenerateTodoSuggestions = useCallback(
    async (command: AICommand, rawInput: string) => {
      try {
        const { userInput, todoDescription, projectId } = command.parameters;
        const prompt = userInput || todoDescription || rawInput;

        if (!prompt?.trim()) {
          chat.addAIMessage(
            'Tell me what you would like to work on and I will propose todos.'
          );
          return;
        }

        const response = await generateTodosMutation.mutateAsync({
          user_input: prompt,
          project_id: projectId,
          existing_todos: todos.map((todo) => todo.title),
        });

        chat.addAIMessage(
          `Here are ${response.generated_todos.length} todo suggestions you can create right away:`,
          {
            type: 'todo_suggestions',
            requestDescription: response.request_description,
            suggestions: response.generated_todos as GeneratedTodo[],
          }
        );
      } catch (error) {
        console.error('generate_todos failed', error);
        chat.addAIMessage(
          'I was unable to generate todo suggestions. Please try again in a moment.'
        );
      }
    },
    [chat, generateTodosMutation, todos]
  );

  const handleImproveDescription = useCallback(
    async (command: AICommand) => {
      try {
        const { todoDescription, todoId } = command.parameters;
        const todo = findTodoMatch(todoId);

        if (!todo && !todoDescription) {
          chat.addAIMessage(
            'Please point me to an existing task or paste the description you want improved.'
          );
          return;
        }

        const response = await optimizeTaskMutation.mutateAsync({
          todo_id: todo?.id,
          current_title: todo?.title,
          current_description: todoDescription || todo?.description,
          optimization_type: 'description',
        });

        chat.addAIMessage("Here's a clearer version of that task:", {
          type: 'optimization',
          optimization: response,
        });
      } catch (error) {
        console.error('optimize_task failed', error);
        chat.addAIMessage(
          'I could not improve that task just now. Give it another try in a little while.'
        );
      }
    },
    [chat, findTodoMatch, optimizeTaskMutation]
  );

  const processCommand = useCallback(
    async (command: AICommand, rawInput: string) => {
      switch (command.type) {
        case 'generate_subtasks':
          await handleGenerateSubtasks(command);
          break;
        case 'analyze_file':
          handleAnalyzeFile();
          break;
        case 'improve_description':
          await handleImproveDescription(command);
          break;
        case 'generate_todos':
        case 'general_chat':
          await handleGenerateTodoSuggestions(command, rawInput);
          break;
        default:
          chat.addAIMessage(
            "I'm not sure how to help with that yet. Try asking me to create todos or optimise a task."
          );
      }
    },
    [
      chat,
      handleGenerateSubtasks,
      handleGenerateTodoSuggestions,
      handleImproveDescription,
      handleAnalyzeFile,
    ]
  );

  const executeCommand = useCallback(
    async (input: string, _file?: File) => {
      if (!input.trim()) return;

      try {
        chat.setLoading(true);
        chat.setError(null);
        chat.addUserMessage(input);

        const command = parser.parseCommand(input);
        const validation = parser.validateCommand(command);

        if (!validation.isValid) {
          chat.addAIMessage(
            `I need a bit more information: ${validation.missingInfo.join(', ')}`
          );
          chat.setLoading(false);
          return;
        }

        const loadingMessageId = chat.addMessage({
          type: 'ai',
          content: 'Thinking through your request...',
          isLoading: true,
        });

        await processCommand(command, input);

        chat.updateMessage(loadingMessageId, { isLoading: false });
        chat.setLoading(false);
      } catch (error) {
        console.error('AI command failed', error);
        chat.setError(
          error instanceof Error
            ? error.message
            : 'Unexpected error while contacting the AI service'
        );
        chat.addAIMessage(
          'I ran into a problem handling that request. Please try again in a moment.'
        );
        chat.setLoading(false);
      }
    },
    [chat, parser, processCommand]
  );

  return {
    executeCommand,
  };
};
