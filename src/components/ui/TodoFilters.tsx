import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { TodoFilters as TodoFiltersType } from '../../services/todoService';
import { Project } from '../../types';

interface TodoFiltersProps {
  filters: TodoFiltersType;
  onFiltersChange: (filters: TodoFiltersType) => void;
  projects?: Project[];
  showProjectFilter?: boolean;
}

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const priorityOptions = [
  { value: '', label: 'All Priorities' },
  { value: 1, label: 'Low' },
  { value: 2, label: 'Low-Medium' },
  { value: 3, label: 'Medium' },
  { value: 4, label: 'High' },
  { value: 5, label: 'Critical' },
];

export const TodoFilters: React.FC<TodoFiltersProps> = ({
  filters,
  onFiltersChange,
  projects = [],
  showProjectFilter = true,
}) => {
  const handleFilterChange = (key: keyof TodoFiltersType, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
      page: 1, // Reset to first page when filters change
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      page: 1,
      limit: filters.limit,
    });
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.status || filters.priority || filters.project_id
  );

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status) count++;
    if (filters.priority) count++;
    if (filters.project_id) count++;
    return count;
  };

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
      <Box display="flex" flexDirection="column" gap={2}>
        {/* Search Bar */}
        <TextField
          placeholder="Search todos..."
          value={filters.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: filters.search && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => handleFilterChange('search', '')}
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          fullWidth
        />

        {/* Filter Controls */}
        <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              label="Status"
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={filters.priority || ''}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              label="Priority"
            >
              {priorityOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {showProjectFilter && projects.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Project</InputLabel>
              <Select
                value={filters.project_id || ''}
                onChange={(e) =>
                  handleFilterChange('project_id', e.target.value)
                }
                label="Project"
              >
                <MenuItem value="">All Projects</MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Active Filters Indicator */}
          {hasActiveFilters && (
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                icon={<FilterIcon />}
                label={`${getActiveFilterCount()} filter${getActiveFilterCount() > 1 ? 's' : ''} active`}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Tooltip title="Clear all filters">
                <IconButton size="small" onClick={clearFilters}>
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
};
