import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Stack,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  SmartToy as AIIcon,
  Psychology as BrainIcon,
  Edit as ManualIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Todo, Project } from '../../types';
import { useGenerateSubtasks } from '../../hooks/useAI';
import { TodoForm } from '../forms/TodoForm';

interface SubtaskCreationDialogProps {
  open: boolean;
  onClose: () => void;
  parentTodo: Todo;
  projects?: Project[];
  onManualSubtaskCreate: (subtaskData: any) => void;
  isCreatingSubtask?: boolean;
}

const aiConfigSchema = z
  .object({
    min_subtasks: z.number().min(1).max(5),
    max_subtasks: z.number().min(3).max(5),
  })
  .refine((data) => data.max_subtasks >= data.min_subtasks, {
    message: 'Maximum must be greater than or equal to minimum',
    path: ['max_subtasks'],
  });

type AIConfigFormData = z.infer<typeof aiConfigSchema>;

type CreationMode = 'selection' | 'ai-config' | 'manual';

export const SubtaskCreationDialog: React.FC<SubtaskCreationDialogProps> = ({
  open,
  onClose,
  parentTodo,
  projects = [],
  onManualSubtaskCreate,
  isCreatingSubtask = false,
}) => {
  const [mode, setMode] = useState<CreationMode>('selection');
  const generateSubtasksMutation = useGenerateSubtasks();

  // Reset mode to selection when dialog opens
  React.useEffect(() => {
    if (open) {
      setMode('selection');
    }
  }, [open]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<AIConfigFormData>({
    resolver: zodResolver(aiConfigSchema),
    mode: 'onChange',
    defaultValues: {
      min_subtasks: 3,
      max_subtasks: 5,
    },
  });

  const handleClose = () => {
    if (!generateSubtasksMutation.isPending && !isCreatingSubtask) {
      setMode('selection');
      reset();
      onClose();
    }
  };

  const handleAIGeneration = async (data: AIConfigFormData) => {
    try {
      await generateSubtasksMutation.mutateAsync({
        todo_id: parentTodo.id,
        min_subtasks: data.min_subtasks,
        max_subtasks: data.max_subtasks,
      });
      handleClose();
    } catch (error) {
      console.error('Failed to generate AI subtasks:', error);
    }
  };

  const handleManualCreate = () => {
    setMode('manual');
  };

  const handleManualSubtaskSubmit = (subtaskData: any) => {
    onManualSubtaskCreate(subtaskData);
    handleClose();
  };

  const renderTitle = () => {
    switch (mode) {
      case 'ai-config':
        return 'Configure AI Subtask Generation';
      case 'manual':
        return 'Create Subtask Manually';
      default:
        return 'Add Subtask';
    }
  };

  const renderSelectionMode = () => (
    <Stack spacing={3}>
      <Typography variant="body1" color="text.secondary" align="center">
        How would you like to add subtasks to "{parentTodo.title}"?
      </Typography>

      <Stack spacing={2}>
        {/* AI Generation Option */}
        <Card
          sx={{
            cursor: 'pointer',
            border: '2px solid transparent',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'action.hover',
            },
          }}
          onClick={() => setMode('ai-config')}
        >
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <AIIcon color="primary" sx={{ fontSize: 32 }} />
              <Box flex={1}>
                <Typography variant="h6" gutterBottom>
                  Generate with AI
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Let AI analyze your task and create intelligent subtasks
                  automatically
                </Typography>
              </Box>
              <Chip
                icon={<BrainIcon />}
                label="Smart"
                color="primary"
                size="small"
              />
            </Box>
          </CardContent>
        </Card>

        {/* Manual Creation Option */}
        <Card
          sx={{
            cursor: 'pointer',
            border: '2px solid transparent',
            '&:hover': {
              borderColor: 'secondary.main',
              backgroundColor: 'action.hover',
            },
          }}
          onClick={handleManualCreate}
        >
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <ManualIcon color="secondary" sx={{ fontSize: 32 }} />
              <Box flex={1}>
                <Typography variant="h6" gutterBottom>
                  Create Manually
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create a single subtask with full control over all details
                </Typography>
              </Box>
              <Chip
                icon={<ManualIcon />}
                label="Custom"
                color="secondary"
                size="small"
              />
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </Stack>
  );

  const renderAIConfigMode = () => (
    <form onSubmit={handleSubmit(handleAIGeneration)}>
      <Stack spacing={3}>
        <Alert severity="info" icon={<AIIcon />}>
          AI will analyze "{parentTodo.title}" and generate actionable subtasks
          based on your preferences.
        </Alert>

        <Box display="flex" gap={2}>
          <Controller
            name="min_subtasks"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Minimum Subtasks"
                type="number"
                slotProps={{
                  htmlInput: { min: 1, max: 5 },
                }}
                error={!!errors.min_subtasks}
                helperText={errors.min_subtasks?.message}
                fullWidth
                disabled={generateSubtasksMutation.isPending}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            )}
          />

          <Controller
            name="max_subtasks"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Maximum Subtasks"
                type="number"
                slotProps={{
                  htmlInput: { min: 3, max: 5 },
                }}
                error={!!errors.max_subtasks}
                helperText={errors.max_subtasks?.message}
                fullWidth
                disabled={generateSubtasksMutation.isPending}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            )}
          />
        </Box>

        {generateSubtasksMutation.error && (
          <Alert severity="error">
            Failed to generate AI subtasks. Please try again.
          </Alert>
        )}

        <Box display="flex" gap={2} justifyContent="flex-end">
          <Button
            onClick={() => setMode('selection')}
            disabled={generateSubtasksMutation.isPending}
            color="inherit"
          >
            Back
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!isValid || generateSubtasksMutation.isPending}
            startIcon={
              generateSubtasksMutation.isPending ? (
                <CircularProgress size={16} />
              ) : (
                <AIIcon />
              )
            }
          >
            {generateSubtasksMutation.isPending
              ? 'Generating...'
              : 'Generate Subtasks'}
          </Button>
        </Box>
      </Stack>
    </form>
  );

  return (
    <>
      <Dialog
        open={open && mode !== 'manual'}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: { minHeight: mode === 'selection' ? '400px' : '300px' },
          },
        }}
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">{renderTitle()}</Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {mode === 'selection' && renderSelectionMode()}
          {mode === 'ai-config' && renderAIConfigMode()}
        </DialogContent>

        {mode === 'selection' && (
          <DialogActions>
            <Button onClick={handleClose} color="inherit">
              Cancel
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Manual Creation Form */}
      <TodoForm
        open={mode === 'manual'}
        onClose={() => setMode('selection')}
        onSubmit={handleManualSubtaskSubmit}
        parentTodoId={parentTodo.id}
        projects={projects}
        isLoading={isCreatingSubtask}
      />
    </>
  );
};
