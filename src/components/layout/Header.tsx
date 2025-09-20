import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  useTheme,
  Fade,
} from '@mui/material';
import {
  Menu as MenuIcon,
  MenuOpen as MenuOpenIcon,
} from '@mui/icons-material';
import { UserButton } from '@clerk/clerk-react';
import {
  getAnimationDuration,
  getAdaptiveAnimationConfig,
  createOptimizedTransition,
  handleKeyboardNavigation,
  announceToScreenReader,
  createFocusVisibleStyles,
  createAccessibleHoverStyles,
} from '../../constants/animations';
import { withAnimationErrorBoundary } from '../common/AnimationErrorBoundary';

interface HeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
  isTransitioning?: boolean;
}

const HeaderComponent: React.FC<HeaderProps> = ({
  onMenuClick,
  sidebarOpen,
  isTransitioning = false,
}) => {
  const theme = useTheme();

  // Use adaptive animation configuration for better performance
  const adaptiveAnimationConfig = React.useMemo(
    () => getAdaptiveAnimationConfig(),
    []
  );

  const iconTransitionDuration = getAnimationDuration(
    adaptiveAnimationConfig.duration.iconTransition
  );

  // Handle keyboard navigation for menu button
  const handleMenuKeyDown = (event: React.KeyboardEvent) => {
    handleKeyboardNavigation(
      event.nativeEvent,
      () => {
        onMenuClick();
        // Announce state change to screen readers
        const newState = sidebarOpen ? 'closed' : 'opened';
        announceToScreenReader(`Navigation menu ${newState}`, 'assertive');
      },
      { keys: ['Enter', ' '] }
    );
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        // Keep header fixed at top regardless of sidebar state
        transform: 'translateX(0)',
        width: '100%',
        // Performance optimizations
        willChange: 'auto',
        backfaceVisibility: 'hidden',
        perspective: 1000,
      }}
    >
      <Toolbar>
        {/* Enhanced Menu button */}
        <IconButton
          color="inherit"
          aria-label={
            sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'
          }
          aria-expanded={sidebarOpen}
          aria-controls="navigation-menu"
          aria-describedby="menu-button-description"
          edge="start"
          onClick={onMenuClick}
          onKeyDown={handleMenuKeyDown}
          disabled={isTransitioning}
          sx={{
            mr: 2,
            position: 'relative',
            minWidth: '48px',
            minHeight: '48px',
            ...createOptimizedTransition(
              ['background-color', 'transform', 'opacity'],
              iconTransitionDuration,
              adaptiveAnimationConfig.easing.enter
            ),
            ...createFocusVisibleStyles(theme.palette.primary.light),
            ...createAccessibleHoverStyles(
              'rgba(255, 255, 255, 0.08)',
              'scale(1.05)'
            ),
            '&:active': {
              transform: 'scale(0.95)',
              '@media (prefers-reduced-motion: reduce)': {
                transform: 'none',
                filter: 'brightness(0.9)',
              },
            },
            '&:disabled': {
              opacity: 0.6,
              cursor: 'not-allowed',
              '&:hover': {
                backgroundColor: 'transparent',
                transform: 'none',
                filter: 'none',
              },
            },
            // Enhanced visual hierarchy
            border: '1px solid transparent',
            borderRadius: '8px',
            padding: '8px',
            // High contrast mode support
            '@media (prefers-contrast: high)': {
              border: '1px solid currentColor',
            },
          }}
        >
          {/* Icon transition container */}
          <Box
            sx={{
              position: 'relative',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Hamburger Menu Icon */}
            <Fade
              in={!sidebarOpen}
              timeout={iconTransitionDuration}
              style={{
                position: 'absolute',
                transitionDelay: sidebarOpen
                  ? '0ms'
                  : `${iconTransitionDuration / 2}ms`,
              }}
            >
              <MenuIcon />
            </Fade>

            {/* Close Menu Icon */}
            <Fade
              in={sidebarOpen}
              timeout={iconTransitionDuration}
              style={{
                position: 'absolute',
                transitionDelay: !sidebarOpen
                  ? '0ms'
                  : `${iconTransitionDuration / 2}ms`,
              }}
            >
              <MenuOpenIcon />
            </Fade>
          </Box>
        </IconButton>

        {/* Hidden description for screen readers */}
        <div
          id="menu-button-description"
          style={{
            position: 'absolute',
            left: '-10000px',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
          }}
        >
          {isTransitioning
            ? 'Menu is currently transitioning, please wait'
            : 'Toggle navigation menu visibility'}
        </div>

        {/* App title */}
        <Typography
          variant="h6"
          noWrap
          component="h1" // Use h1 for better semantic structure
          sx={{
            flexGrow: 1,
            fontWeight: 600,
            ...createOptimizedTransition(
              'transform',
              getAnimationDuration(adaptiveAnimationConfig.duration.content),
              adaptiveAnimationConfig.easing.enter
            ),
            // Ensure title is readable in high contrast mode
            '@media (prefers-contrast: high)': {
              fontWeight: 700,
            },
          }}
        >
          TodoList
        </Typography>

        {/* User menu */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <UserButton
            appearance={{
              elements: {
                avatarBox: {
                  width: '32px',
                  height: '32px',
                },
              },
            }}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

// Export with animation error boundary
export const Header = withAnimationErrorBoundary(
  HeaderComponent,
  'header-animation',
  'Header'
);
