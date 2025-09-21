import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Autocomplete,
  Chip,
  Stack,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { AutoAwesome as AIIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Todo, Project, GeneratedSubtask } from '../../types';
import {
  CreateTodoRequest,
  UpdateTodoRequest,
} from '../../services/todoService';
import { useGenerateSubtasks } from '../../hooks/useAI';

const todoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title is too long'),
  description: z.string().optional(),
  status: z.string(),
  priority: z.number().min(1).max(5),
  due_date: z.string().optional(),
  project_id: z.string().optional(),
});

type TodoFormData = z.infer<typeof todoSchema>;

interface TodoFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTodoRequest | UpdateTodoRequest) => void;
  todo?: Todo | null;
  parentTodoId?: string;
  projects?: Project[];
  isLoading?: boolean;
}

const statusOptions = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const priorityOptions = [
  { value: 1, label: 'Low' },
  { value: 2, label: 'Low-Medium' },
  { value: 3, label: 'Medium' },
  { value: 4, label: 'High' },
  { value: 5, label: 'Critical' },
];

export const TodoForm: React.FC<TodoFormProps> = ({
  open,
  onClose,
  onSubmit,
  todo = null,
  parentTodoId,
  projects = [],
  isLoading = false,
}) => {
  const isEditing = Boolean(todo);
  const [aiSuggestions, setAiSuggestions] = useState<GeneratedSubtask[]>([]);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  const generateSubtasksMutation = useGenerateSubtasks();

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isValid },
  } = useForm<TodoFormData>({
    resolver: zodResolver(todoSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'todo',
      priority: 3,
      due_date: '',
      project_id: '',
    },
  });

  // Reset form when todo changes or dialog opens/closes
  useEffect(() => {
    if (open) {
      if (todo) {
        reset({
          title: todo.title,
          description: todo.description || '',
          status: todo.status,
          priority: todo.priority,
          due_date: todo.due_date ? todo.due_date.split('T')[0] : '',
          project_id: todo.project_id || '',
        });
      } else {
        reset({
          title: '',
          description: '',
          status: 'todo',
          priority: 3,
          due_date: '',
          project_id: '',
        });
      }
    }
  }, [open, todo, reset]);

  const handleFormSubmit = (data: TodoFormData) => {
    const submitData = {
      ...data,
      due_date: data.due_date ? `${data.due_date}T00:00:00Z` : undefined,
      project_id: data.project_id || undefined,
      description: data.description || undefined,
      parent_todo_id: parentTodoId || undefined,
    };

    if (isEditing && todo) {
      onSubmit({ id: todo.id, ...submitData } as UpdateTodoRequest);
    } else {
      onSubmit(submitData as CreateTodoRequest);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setAiSuggestions([]);
      setShowAISuggestions(false);
      onClose();
    }
  };

  const handleGenerateAISuggestions = async () => {
    // Check if we're editing an existing todo
    if (!todo?.id) {
      console.warn(
        'AI subtask generation is only available for existing todos'
      );
      return;
    }

    const formValues = getValues();
    const { title } = formValues;

    if (!title?.trim()) {
      return;
    }

    try {
      const subtasks = await generateSubtasksMutation.mutateAsync({
        todo_id: todo.id,
        max_subtasks: 5,
      });

      setAiSuggestions(subtasks);
      setShowAISuggestions(true);
    } catch (error) {
      console.error('Failed to generate AI subtasks:', error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' },
      }}
    >
      <DialogTitle>
        <Typography variant="h6">
          {isEditing
            ? 'Edit Todo'
            : parentTodoId
              ? 'Create New Subtask'
              : 'Create New Todo'}
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3}>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Title"
                  fullWidth
                  required
                  error={!!errors.title}
                  helperText={errors.title?.message}
                  disabled={isLoading}
                />
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  disabled={isLoading}
                />
              )}
            />

            {/* AI Suggestions Section - Only show when editing an existing todo */}
            {!parentTodoId && isEditing && (
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Button
                    variant="outlined"
                    startIcon={
                      generateSubtasksMutation.isPending ? (
                        <CircularProgress size={16} />
                      ) : (
                        <AIIcon />
                      )
                    }
                    onClick={handleGenerateAISuggestions}
                    disabled={
                      generateSubtasksMutation.isPending ||
                      isLoading ||
                      !todo?.id
                    }
                    size="small"
                  >
                    {generateSubtasksMutation.isPending
                      ? 'Generating...'
                      : todo?.id
                        ? 'Generate AI Subtasks'
                        : 'AI Subtasks (Save first)'}
                  </Button>
                  {generateSubtasksMutation.error && (
                    <Tooltip title="Failed to generate suggestions">
                      <Alert
                        severity="error"
                        sx={{ p: 0.5, fontSize: '0.8rem' }}
                      >
                        AI Error
                      </Alert>
                    </Tooltip>
                  )}
                </Box>

                {showAISuggestions && aiSuggestions.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      AI Generated Subtasks:
                    </Typography>
                    <Stack spacing={1}>
                      {aiSuggestions.map((suggestion, index) => (
                        <Chip
                          key={index}
                          label={`${suggestion.title}${
                            suggestion.description
                              ? ` - ${suggestion.description}`
                              : ''
                          }`}
                          variant="outlined"
                          size="small"
                          sx={{
                            height: 'auto',
                            '& .MuiChip-label': {
                              display: 'block',
                              whiteSpace: 'normal',
                              padding: '8px',
                            },
                          }}
                        />
                      ))}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" mt={1}>
                      Note: These are AI-generated suggestions. You can create
                      subtasks manually after creating the main todo.
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            <Box display="flex" gap={2}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.status}>
                    <InputLabel>Status</InputLabel>
                    <Select {...field} label="Status" disabled={isLoading}>
                      {statusOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />

              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.priority}>
                    <InputLabel>Priority</InputLabel>
                    <Select {...field} label="Priority" disabled={isLoading}>
                      {priorityOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Box>

            <Controller
              name="due_date"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Due Date"
                  type="date"
                  fullWidth
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                  error={!!errors.due_date}
                  helperText={errors.due_date?.message}
                  disabled={isLoading}
                />
              )}
            />

            {projects.length > 0 && (
              <Controller
                name="project_id"
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <Autocomplete
                    {...field}
                    options={projects}
                    getOptionLabel={(option) => option.name}
                    value={projects.find((p) => p.id === value) || null}
                    onChange={(_, newValue) => onChange(newValue?.id || '')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Project (Optional)"
                        error={!!errors.project_id}
                        helperText={errors.project_id?.message}
                        disabled={isLoading}
                      />
                    )}
                    disabled={isLoading}
                  />
                )}
              />
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={handleClose} disabled={isLoading} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!isValid || isLoading}
          >
            {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
