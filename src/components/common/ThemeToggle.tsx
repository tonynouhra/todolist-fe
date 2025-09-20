import React from 'react';
import { IconButton, Tooltip, useTheme as useMuiTheme } from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  size = 'medium',
  showTooltip = true,
  className,
}) => {
  const { mode, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();

  const isDark = mode === 'dark';
  const icon = isDark ? <LightModeIcon /> : <DarkModeIcon />;
  const tooltipText = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  const button = (
    <IconButton
      onClick={toggleTheme}
      size={size}
      className={className}
      aria-label={tooltipText}
      sx={{
        color: muiTheme.palette.text.primary,
        '&:hover': {
          backgroundColor: muiTheme.palette.action.hover,
        },
      }}
    >
      {icon}
    </IconButton>
  );

  if (showTooltip) {
    return (
      <Tooltip title={tooltipText} arrow>
        {button}
      </Tooltip>
    );
  }

  return button;
};

export default ThemeToggle;
