import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachIcon,
  AddComment as NewChatIcon,
  Clear as ClearIcon,
  SmartToy as AIIcon,
} from '@mui/icons-material';
import { AIMessageBubble } from './AIMessageBubble';
import type { AIMessageData } from './AIMessageBubble';
import { AIResponseHandler } from './AIResponseHandler';
import type { UseAIChatReturn } from '../../hooks/ai/useAIChat';
import { useAICommands } from '../../hooks/ai/useAICommands';
import { AICommandParser } from '../../utils/ai/commandParser';
import { useCreateTodo, useTodos } from '../../hooks/useTodos';
import { GeneratedSubtask, GeneratedTodo, Todo } from '../../types';

interface AIChatInterfaceProps {
  chat: UseAIChatReturn;
  height?: string | number;
  onTodoCreated?: (todo: any) => void;
  className?: string;
}

export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({
  chat,
  height = '600px',
  onTodoCreated,
  className,
}) => {
  const theme = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const parser = new AICommandParser();
  const { data: todosResponse } = useTodos({ limit: 100 });
  const availableTodos: Todo[] = todosResponse?.data ?? [];

  const commands = useAICommands({ chat, parser, todos: availableTodos });
  const createTodoMutation = useCreateTodo();

  const activeSession = useMemo(
    () => chat.sessions.find((session) => session.id === chat.activeSessionId),
    [chat.sessions, chat.activeSessionId]
  );

  useEffect(() => {
    setAttachedFile(null);
    setInputValue('');
  }, [chat.activeSessionId]);

  // Handle message submission
  const handleSubmit = useCallback(async () => {
    if (!inputValue.trim()) {
      if (attachedFile) {
        chat.addSystemMessage(
          'Please include a brief message describing how I should use the attached file.'
        );
      }
      return;
    }

    const message = inputValue.trim();
    setInputValue('');

    try {
      await commands.executeCommand(message, attachedFile || undefined);
      if (attachedFile) {
        setAttachedFile(null);
      }
    } catch (error) {
      console.error('Failed to execute command:', error);
    }
  }, [inputValue, attachedFile, commands, chat]);

  // Handle Enter key press
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  // Handle file upload
  const handleFileUpload = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      chat.addSystemMessage('File size must be less than 10MB');
      return;
    }

    setAttachedFile(file);
    chat.addSystemMessage(`File attached: ${file.name}`);
  };

  // File input change handler
  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);

    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Handle todo creation from AI responses
  const handleCreateTodos = async (
    todos: Array<Partial<GeneratedSubtask> | Partial<GeneratedTodo>>
  ) => {
    try {
      const createdTodos = [];
      for (const todo of todos) {
        const priorityValue = Math.min(
          Math.max(Number(todo.priority ?? 3), 1),
          5
        ) as 1 | 2 | 3 | 4 | 5;

        const result = await createTodoMutation.mutateAsync({
          title: todo.title || 'Untitled Task',
          description: todo.description,
          priority: priorityValue,
          status: 'todo',
          ai_generated: true,
        });
        createdTodos.push(result);
      }

      chat.addSystemMessage(
        `✅ Created ${createdTodos.length} todo(s) successfully!`
      );

      if (onTodoCreated) {
        createdTodos.forEach(onTodoCreated);
      }
    } catch (error) {
      console.error('Failed to create todos:', error);
      chat.addSystemMessage(
        '❌ Failed to create some todos. Please try again.'
      );
    }
  };

  // Handle copy message content
  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    chat.addSystemMessage('📋 Message copied to clipboard');
  };

  // Handle message feedback
  const handleMessageFeedback = (messageId: string, isPositive: boolean) => {
    // Could send feedback to analytics or improve AI responses
    chat.addSystemMessage(
      isPositive
        ? '👍 Thanks for the feedback!'
        : "👎 Thanks for the feedback, I'll try to improve!"
    );
  };

  const getApproveAllHandler = (data: AIMessageData) => {
    if (data.type === 'todo_suggestions') {
      return () => handleCreateTodos(data.suggestions);
    }

    return undefined;
  };

  // Clear chat
  const handleStartNewChat = () => {
    chat.startNewSession();
    setAttachedFile(null);
    setInputValue('');
  };

  return (
    <Box
      className={className}
      sx={{
        height,
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            border: `2px dashed ${theme.palette.primary.main}`,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <Typography variant="h6" color="primary">
            Drop file here to analyze
          </Typography>
        </Box>
      )}

      {/* Chat header */}
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor:
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.primary.main, 0.08)
              : theme.palette.grey[50],
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <AIIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
          <Box>
            <Typography variant="h6" color="primary">
              AI Assistant
            </Typography>
            {activeSession && (
              <Typography variant="caption" color="text.secondary">
                {activeSession.title}
              </Typography>
            )}
          </Box>
        </Box>
        <Tooltip title="Start new chat">
          <IconButton size="small" onClick={handleStartNewChat}>
            <NewChatIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Messages area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {chat.messages.map((message) => (
          <AIMessageBubble
            key={message.id}
            message={message}
            onCopy={handleCopyMessage}
            onFeedback={handleMessageFeedback}
          >
            {message.data && (
              <AIResponseHandler
                data={message.data}
                onCreateTodos={handleCreateTodos}
                onApproveAll={getApproveAllHandler(message.data)}
              />
            )}
          </AIMessageBubble>
        ))}

        {chat.isLoading && (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={24} />
          </Box>
        )}

        {chat.error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {chat.error}
          </Alert>
        )}

        <div ref={chat.messagesEndRef} />
      </Box>

      {/* File attachment display */}
      {attachedFile && (
        <Box
          sx={{
            p: 1,
            backgroundColor: theme.palette.grey[100],
            borderTop: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <AttachIcon fontSize="small" />
          <Typography variant="body2" sx={{ flex: 1 }}>
            {attachedFile.name}
          </Typography>
          <IconButton size="small" onClick={() => setAttachedFile(null)}>
            <ClearIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* Input area */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Box display="flex" gap={1} alignItems="flex-end">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
            accept=".txt,.md,.doc,.docx,.pdf,.json"
          />

          <Tooltip title="Attach file">
            <IconButton
              onClick={() => fileInputRef.current?.click()}
              disabled={chat.isLoading}
            >
              <AttachIcon />
            </IconButton>
          </Tooltip>

          <TextField
            ref={inputRef}
            fullWidth
            multiline
            maxRows={4}
            placeholder="Ask me to generate subtasks, analyze files, or create todos..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={chat.isLoading}
            variant="outlined"
            size="small"
          />

          <Tooltip title="Send message">
            <IconButton
              onClick={handleSubmit}
              disabled={(!inputValue.trim() && !attachedFile) || chat.isLoading}
              color="primary"
            >
              <SendIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Quick suggestions */}
        <Box mt={1} display="flex" flexWrap="wrap" gap={0.5}>
          {[
            "Break down 'Build mobile app' into subtasks",
            'Create a todo list for planning a wedding',
            'Analyze this file for tasks',
            'Improve my task description',
          ].map((suggestion, index) => (
            <Tooltip key={index} title="Click to use this suggestion">
              <Typography
                variant="caption"
                sx={{
                  px: 1,
                  py: 0.5,
                  borderRadius: 999,
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.primary.main, 0.15)
                      : alpha(theme.palette.primary.light, 0.25),
                  color:
                    theme.palette.mode === 'dark'
                      ? theme.palette.primary.light
                      : theme.palette.primary.dark,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor:
                      theme.palette.mode === 'dark'
                        ? alpha(theme.palette.primary.main, 0.25)
                        : alpha(theme.palette.primary.light, 0.35),
                  },
                }}
                onClick={() => setInputValue(suggestion)}
              >
                {suggestion}
              </Typography>
            </Tooltip>
          ))}
        </Box>
      </Box>
    </Box>
  );
};
