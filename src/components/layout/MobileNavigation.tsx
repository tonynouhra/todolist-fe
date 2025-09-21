import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useTheme,
} from '@mui/material';
import { getAllNavigationItems, isNavigationItemActive } from '../../constants';

export const MobileNavigation: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Get navigation items from shared configuration
  const navigationItems = getAllNavigationItems();

  const currentIndex = navigationItems.findIndex((item) =>
    isNavigationItemActive(item, location.pathname)
  );

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    const item = navigationItems[newValue];
    if (!item.disabled) {
      navigate(item.path, { replace: item.path === location.pathname });
    }
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar,
        borderTop: `1px solid ${theme.palette.divider}`,
        // Enhanced responsive behavior
        display: { xs: 'block', md: 'none' },
        // Additional responsive safety measures
        '@media (min-width: 900px)': {
          display: 'none !important',
        },
        '@media (max-width: 899px)': {
          display: 'block',
        },
      }}
      elevation={8}
      role="navigation"
      aria-label="Mobile navigation"
    >
      <BottomNavigation
        value={currentIndex >= 0 ? currentIndex : 0}
        onChange={handleChange}
        showLabels
        sx={{
          height: 64,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            '&.Mui-disabled': {
              opacity: 0.5,
            },
            '&:focus-visible': {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: '2px',
            },
            // Reduced motion support
            '@media (prefers-reduced-motion: reduce)': {
              transition: 'none !important',
            },
          },
        }}
        role="tablist"
        aria-label="Main navigation tabs"
      >
        {navigationItems.map((item) => (
          <BottomNavigationAction
            key={item.path}
            label={item.text}
            icon={item.icon}
            disabled={item.disabled}
            sx={{
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
            }}
            aria-label={`Navigate to ${item.text}`}
            aria-current={
              isNavigationItemActive(item, location.pathname)
                ? 'page'
                : undefined
            }
            role="tab"
            tabIndex={0}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};
