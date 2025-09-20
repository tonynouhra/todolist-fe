import React from 'react';
import { ProjectCard } from './ProjectCard';
import { Project } from '../../types';

interface ProjectCardWithStatsProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onClick: (project: Project) => void;
}

export const ProjectCardWithStats: React.FC<ProjectCardWithStatsProps> = ({
  project,
  onEdit,
  onDelete,
  onClick,
}) => {
  // Use project data directly - todo_count and completed_todo_count are included
  const totalTodos = project.todo_count || 0;
  const completedTodos = project.completed_todo_count || 0;
  const stats = {
    total_todos: totalTodos,
    completed_todos: completedTodos,
    in_progress_todos: Math.max(0, totalTodos - completedTodos), // Approximate remaining
    pending_todos: 0, // Not available in current data structure
  };

  return (
    <ProjectCard
      project={project}
      onEdit={onEdit}
      onDelete={onDelete}
      onClick={onClick}
      stats={stats}
    />
  );
};
