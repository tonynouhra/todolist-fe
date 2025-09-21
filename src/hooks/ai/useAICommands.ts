import { useCallback } from 'react';
import { AICommandParser, AICommand } from '../../utils/ai/commandParser';
import {
  useGenerateSubtasks,
  useAnalyzeFile,
  useGenerateTodoSuggestions,
  useOptimizeTask,
} from '../useAI';
import { UseAIChatReturn } from './useAIChat';

interface UseAICommandsProps {
  chat: UseAIChatReturn;
  parser: AICommandParser;
}

export interface UseAICommandsReturn {
  executeCommand: (input: string, file?: File) => Promise<void>;
  processCommand: (command: AICommand, file?: File) => Promise<void>;
}

export const useAICommands = ({
  chat,
  parser,
}: UseAICommandsProps): UseAICommandsReturn => {
  const generateSubtasksMutation = useGenerateSubtasks();
  const analyzeFileMutation = useAnalyzeFile();
  const generateTodosMutation = useGenerateTodoSuggestions();
  const optimizeTaskMutation = useOptimizeTask();

  const executeCommand = useCallback(
    async (input: string, file?: File) => {
      try {
        chat.setLoading(true);
        chat.setError(null);

        // Add user message to chat
        const userMessageId = chat.addUserMessage(input);

        // Parse the command
        const command = parser.parseCommand(input);

        // Validate command
        const validation = parser.validateCommand(command);
        if (!validation.isValid) {
          const errorMessage = `I need more information to help you: ${validation.missingInfo.join(', ')}`;
          chat.addAIMessage(errorMessage);
          chat.setLoading(false);
          return;
        }

        // Add loading message
        const loadingMessageId = chat.addMessage({
          type: 'ai',
          content: 'Processing your request...',
          isLoading: true,
        });

        // Process the command
        await processCommand(command, file);

        // Remove loading message
        chat.updateMessage(loadingMessageId, { isLoading: false });
        chat.setLoading(false);
      } catch (error) {
        console.error('Command execution error:', error);
        chat.setError(
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred'
        );
        chat.addAIMessage(
          'Sorry, I encountered an error processing your request. Please try again.'
        );
        chat.setLoading(false);
      }
    },
    [chat, parser]
  );

  const processCommand = useCallback(
    async (command: AICommand, file?: File) => {
      switch (command.type) {
        case 'generate_subtasks':
          await handleGenerateSubtasks(command);
          break;

        case 'analyze_file':
          await handleAnalyzeFile(command, file);
          break;

        case 'generate_todos':
          await handleGenerateTodos(command);
          break;

        case 'improve_description':
          await handleImproveDescription(command);
          break;

        case 'general_chat':
          handleGeneralChat(command);
          break;

        default:
          chat.addAIMessage(
            "I'm not sure how to help with that. You can ask me to:\n\n" +
              '• Generate subtasks for a todo\n' +
              '• Analyze files for task extraction\n' +
              '• Create todo lists from descriptions\n' +
              '• Improve task descriptions'
          );
      }
    },
    [
      generateSubtasksMutation,
      analyzeFileMutation,
      generateTodosMutation,
      improveDescriptionMutation,
      chat,
    ]
  );

  const handleGenerateSubtasks = async (command: AICommand) => {
    try {
      const { todoTitle, todoDescription, todoId } = command.parameters;

      if (!todoTitle && !todoId) {
        chat.addAIMessage(
          'Please provide a task title or ID to generate subtasks.'
        );
        return;
      }

      const result = await generateSubtasksMutation.mutateAsync({
        todo_id: todoId || 'temp-id', // Will be handled by backend
        task_title: todoTitle,
        task_description: todoDescription,
        min_subtasks: 3,
        max_subtasks: 7,
      });

      const responseContent = `I've generated ${result.length} subtasks for "${todoTitle}":`;

      const messageId = chat.addAIMessage(responseContent, {
        type: 'subtasks',
        data: result,
      });

      // Add suggestions
      const suggestions = parser.getSuggestions(command);
      if (suggestions.length > 0) {
        chat.addSystemMessage(`Suggestions: ${suggestions.join(' • ')}`);
      }
    } catch (error) {
      console.error('Subtask generation error:', error);
      chat.addAIMessage(
        'Sorry, I encountered an error generating subtasks. Please try again.'
      );
    }
  };

  const handleAnalyzeFile = async (command: AICommand, file?: File) => {
    try {
      if (!file) {
        chat.addAIMessage('Please upload a file to analyze.');
        return;
      }

      const fileContent = await readFileAsText(file);

      const result = await analyzeFileMutation.mutateAsync({
        file_content: fileContent,
        file_name: file.name,
        analysis_type: 'todo_extraction',
      });

      const responseContent = `I've analyzed "${file.name}" and found ${result.suggested_todos?.length || 0} potential tasks:`;

      chat.addAIMessage(responseContent, {
        type: 'analysis',
        data: result,
      });
    } catch (error) {
      console.error('File analysis error:', error);
      chat.addAIMessage(
        'Sorry, I encountered an error analyzing the file. Please try again.'
      );
    }
  };

  const handleGenerateTodos = async (command: AICommand) => {
    try {
      const { todoDescription, userInput, projectId } = command.parameters;

      const result = await generateTodosMutation.mutateAsync({
        project_id: projectId,
        user_input: userInput || todoDescription,
        existing_todos: [], // Could be populated from current todos
      });

      const responseContent = `I've created ${result.length} todos based on your request:`;

      chat.addAIMessage(responseContent, {
        type: 'todos',
        data: result,
      });
    } catch (error) {
      console.error('Todo generation error:', error);
      chat.addAIMessage(
        'Sorry, I encountered an error generating todos. Please try again.'
      );
    }
  };

  const handleImproveDescription = async (command: AICommand) => {
    try {
      const { todoDescription, todoId } = command.parameters;

      if (!todoDescription && !todoId) {
        chat.addAIMessage('Please provide a task description to improve.');
        return;
      }

      const result = await optimizeTaskMutation.mutateAsync({
        todo_id: todoId,
        current_description: todoDescription,
        optimization_type: 'description',
      });

      const optimizedText =
        result.optimized_description ||
        result.optimized_title ||
        todoDescription;
      const improvements =
        result.improvements.length > 0
          ? `\n\nImprovements made: ${result.improvements.join(', ')}`
          : '';

      chat.addAIMessage(
        `Here's an improved version of your task description:\n\n"${optimizedText}"${improvements}`,
        {
          type: 'improvement',
          data: result,
        }
      );
    } catch (error) {
      console.error('Description improvement error:', error);
      chat.addAIMessage(
        'Sorry, I encountered an error improving the description. Please try again.'
      );
    }
  };

  const handleGeneralChat = (command: AICommand) => {
    const responses = [
      "I'm here to help you manage your tasks! You can ask me to:\n\n" +
        '• **Generate subtasks** - "Break down \'Plan wedding\' into subtasks"\n' +
        '• **Analyze files** - Upload a document to extract tasks\n' +
        '• **Create todos** - "Create a todo list for moving house"\n' +
        '• **Improve descriptions** - "Make this task clearer: [description]"\n\n' +
        'What would you like to work on?',

      'I can help you be more productive with AI-powered task management!\n\n' +
        'Try asking me something like:\n' +
        '• "How to organize a conference?"\n' +
        '• "Break down \'Build mobile app\' into steps"\n' +
        '• "Analyze this meeting notes file"\n\n' +
        "What's on your mind?",

      'Let me help you get organized! I specialize in:\n\n' +
        '✅ Breaking big tasks into manageable steps\n' +
        '✅ Extracting action items from documents\n' +
        '✅ Creating comprehensive todo lists\n' +
        '✅ Improving task clarity and detail\n\n' +
        'How can I assist you today?',
    ];

    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];
    chat.addAIMessage(randomResponse);
  };

  return {
    executeCommand,
    processCommand,
  };
};

// Helper function to read file as text
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target?.result as string);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsText(file);
  });
};
