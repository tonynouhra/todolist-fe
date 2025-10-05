import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Person as UserIcon,
  SmartToy as AIIcon,
  Info as SystemIcon,
  ContentCopy as CopyIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import type {
  GeneratedSubtask,
  GeneratedTodo,
  FileAnalysisResponse,
  TaskOptimizationResponse,
} from '../../types';

export type AIMessageData =
  | {
      type: 'subtasks';
      parentTaskTitle: string;
      subtasks: GeneratedSubtask[];
      autoCreated?: boolean;
    }
  | {
      type: 'todo_suggestions';
      requestDescription: string;
      suggestions: GeneratedTodo[];
    }
  | {
      type: 'analysis';
      analysis: FileAnalysisResponse;
    }
  | {
      type: 'optimization';
      optimization: TaskOptimizationResponse;
    };

export interface AIMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  data?: AIMessageData; // Structured payload rendered by AIResponseHandler
  isLoading?: boolean;
  error?: string;
}

interface AIMessageBubbleProps {
  message: AIMessage;
  onCopy?: (content: string) => void;
  onFeedback?: (messageId: string, isPositive: boolean) => void;
  children?: React.ReactNode;
}

export const AIMessageBubble: React.FC<AIMessageBubbleProps> = ({
  message,
  onCopy,
  onFeedback,
  children,
}) => {
  const theme = useTheme();

  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';

  const getMessageStyles = () => {
    if (isUser) {
      return {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        alignSelf: 'flex-end',
        borderRadius: '20px 20px 4px 20px',
      };
    }

    if (isSystem) {
      return {
        backgroundColor:
          theme.palette.mode === 'dark'
            ? theme.palette.grey[900]
            : theme.palette.grey[50],
        color: theme.palette.text.secondary,
        alignSelf: 'flex-start',
        borderRadius: '20px 20px 20px 4px',
        border: `1px solid ${theme.palette.divider}`,
      };
    }

    return {
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
      alignSelf: 'flex-start',
      borderRadius: '20px 20px 20px 4px',
      border: `1px solid ${theme.palette.grey[200]}`,
    };
  };

  const getAvatar = () => {
    if (isUser) {
      return <UserIcon sx={{ color: theme.palette.primary.main }} />;
    }
    if (isSystem) {
      return <SystemIcon sx={{ color: theme.palette.grey[600] }} />;
    }
    return <AIIcon sx={{ color: theme.palette.primary.main }} />;
  };

  const handleCopy = () => {
    if (onCopy) {
      onCopy(message.content);
    } else {
      navigator.clipboard.writeText(message.content);
    }
  };

  return (
    <Box
      display="flex"
      flexDirection={isUser ? 'row-reverse' : 'row'}
      alignItems="flex-start"
      gap={1}
      mb={2}
      sx={{
        maxWidth: '80%',
        alignSelf: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      {!isSystem && (
        <Avatar
          sx={{
            width: 32,
            height: 32,
            backgroundColor: isUser
              ? theme.palette.primary.light
              : theme.palette.primary.light,
          }}
        >
          {getAvatar()}
        </Avatar>
      )}

      <Box display="flex" flexDirection="column" gap={0.5} flex={1}>
        <Paper
          elevation={isUser ? 2 : 1}
          sx={{
            p: 1.5,
            ...getMessageStyles(),
            position: 'relative',
          }}
        >
          {message.error && (
            <Chip label="Error" color="error" size="small" sx={{ mb: 1 }} />
          )}

          {message.isLoading && (
            <Chip
              label="Thinking..."
              color="primary"
              size="small"
              sx={{ mb: 1 }}
            />
          )}

          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {message.content}
          </Typography>

          {message.error && (
            <Typography
              variant="caption"
              color="error"
              sx={{ mt: 1, display: 'block' }}
            >
              {message.error}
            </Typography>
          )}

          {children && <Box mt={1}>{children}</Box>}

          {!isUser && !isSystem && !message.isLoading && (
            <Box
              display="flex"
              justifyContent="flex-end"
              alignItems="center"
              gap={0.5}
              mt={1}
              sx={{ opacity: 0.7 }}
            >
              <Tooltip title="Copy message">
                <IconButton
                  size="small"
                  onClick={handleCopy}
                  sx={{
                    color: 'inherit',
                    p: 0.5,
                  }}
                >
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {onFeedback && (
                <>
                  <Tooltip title="Helpful">
                    <IconButton
                      size="small"
                      onClick={() => onFeedback(message.id, true)}
                      sx={{
                        color: 'inherit',
                        p: 0.5,
                      }}
                    >
                      <ThumbUpIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Not helpful">
                    <IconButton
                      size="small"
                      onClick={() => onFeedback(message.id, false)}
                      sx={{
                        color: 'inherit',
                        p: 0.5,
                      }}
                    >
                      <ThumbDownIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
          )}
        </Paper>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            alignSelf: isUser ? 'flex-end' : 'flex-start',
            px: 1,
          }}
        >
          {format(message.timestamp, 'HH:mm')}
        </Typography>
      </Box>
    </Box>
  );
};
