import React, { useEffect, useRef } from 'react';
import { Fab, Zoom, useTheme, alpha } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import {
  getAnimationDuration,
  getAdaptiveAnimationConfig,
  createOptimizedTransition,
  measureAnimationPerformance,
  handleKeyboardNavigation,
  announceToScreenReader,
  createFocusVisibleStyles,
  createAccessibleHoverStyles,
} from '../../constants/animations';
import { withAnimationErrorBoundary } from '../common/AnimationErrorBoundary';

interface AddTodoFABProps {
  visible: boolean;
  onClick: () => void;
  position?: 'bottom-right' | 'footer-integrated';
  disabled?: boolean;
}

const AddTodoFABComponent: React.FC<AddTodoFABProps> = ({
  visible,
  onClick,
  position = 'footer-integrated',
  disabled = false,
}) => {
  const theme = useTheme();
  const mountedRef = useRef(true);
  const fabRef = useRef<HTMLButtonElement>(null);

  // Use adaptive animation configuration for better performance
  const adaptiveAnimationConfig = React.useMemo(
    () => getAdaptiveAnimationConfig(),
    []
  );

  // Set mounted state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Enhanced accessibility announcements
  useEffect(() => {
    if (visible && fabRef.current && position === 'footer-integrated') {
      // Announce FAB availability to screen readers
      announceToScreenReader(
        'Add todo button is now available. Press Tab to navigate to it.',
        'polite'
      );
    } else if (!visible && position === 'footer-integrated') {
      // Announce when FAB is no longer available
      announceToScreenReader(
        'Add todo button is no longer available.',
        'polite'
      );
    }
  }, [visible, position]);

  const handleClick = () => {
    console.log('AddTodoFAB clicked!', {
      disabled,
      mounted: mountedRef.current,
    });
    if (!mountedRef.current || disabled) return;

    measureAnimationPerformance('add-todo-fab-click', () => {
      onClick();
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Enhanced keyboard navigation
    handleKeyboardNavigation(
      event.nativeEvent,
      () => {
        handleClick();
        announceToScreenReader('Opening add todo dialog', 'assertive');
      },
      { keys: ['Enter', ' '] }
    );
  };

  // Position-specific styling
  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: theme.zIndex.fab,
      // Performance optimizations
      willChange: visible ? 'transform, opacity' : 'auto',
      backfaceVisibility: 'hidden' as const,
      perspective: 1000,
    };

    switch (position) {
      case 'footer-integrated':
        return {
          ...baseStyles,
          bottom: 96, // Above footer navigation (64px height + 32px spacing for more breathing room)
          right: 24,
          zIndex: theme.zIndex.fab + 1, // Ensure it's above everything
          // Ensure it doesn't interfere with footer navigation
          '@media (max-width: 899px)': {
            display: 'none', // Hide on mobile since footer navigation is not shown
          },
        };
      case 'bottom-right':
      default:
        return {
          ...baseStyles,
          bottom: 24,
          right: 24,
        };
    }
  };

  // Debug logging
  console.log('AddTodoFAB render:', { visible, position, disabled });

  return (
    <Zoom
      in={visible}
      timeout={{
        enter: getAnimationDuration(100), // Very fast enter animation
        exit: getAnimationDuration(100), // Very fast exit animation
      }}
      style={{
        transitionDelay: '0ms', // No delay for immediate appearance
      }}
      unmountOnExit
    >
      <Fab
        ref={fabRef}
        color="primary"
        aria-label="Add new todo item"
        aria-describedby="fab-description"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        sx={{
          ...getPositionStyles(),
          // Ensure minimum touch target size
          minWidth: '56px',
          minHeight: '56px',
          // Enhanced visual styling
          boxShadow: theme.shadows[6],
          // Temporary debug styling to make it super visible
          border: '3px solid red !important',
          backgroundColor: 'blue !important',
          ...createOptimizedTransition(
            ['background-color', 'box-shadow', 'transform'],
            getAnimationDuration(
              adaptiveAnimationConfig.duration.iconTransition
            ),
            adaptiveAnimationConfig.easing.smooth
          ),
          ...createFocusVisibleStyles(theme.palette.primary.main),
          ...createAccessibleHoverStyles(
            alpha(theme.palette.primary.main, 0.9),
            'scale(1.05)'
          ),
          '&:hover': {
            boxShadow: theme.shadows[8],
          },
          '&:active': {
            transform: 'scale(0.95)',
            boxShadow: theme.shadows[4],
            '@media (prefers-reduced-motion: reduce)': {
              transform: 'none',
              filter: 'brightness(0.9)',
            },
          },
          '&:disabled': {
            backgroundColor: theme.palette.action.disabledBackground,
            color: theme.palette.action.disabled,
            boxShadow: theme.shadows[1],
            transform: 'none',
            cursor: 'not-allowed',
            opacity: 0.6,
          },
          // High contrast mode support
          '@media (prefers-contrast: high)': {
            border: '2px solid currentColor',
          },
        }}
      >
        <AddIcon />

        {/* Hidden description for screen readers */}
        <div
          id="fab-description"
          style={{
            position: 'absolute',
            left: '-10000px',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
          }}
        >
          {disabled
            ? 'Add todo button is currently disabled'
            : 'Click to open the add todo dialog'}
        </div>
      </Fab>
    </Zoom>
  );
};

// Export with animation error boundary
export const AddTodoFAB = withAnimationErrorBoundary(
  AddTodoFABComponent,
  'add-todo-fab',
  'AddTodoFAB'
);
