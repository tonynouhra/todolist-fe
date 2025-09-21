import React, { useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Slide,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import {
  getFooterNavigationItems,
  isNavigationItemActive,
  getAnimationDuration,
  getAdaptiveAnimationConfig,
  createOptimizedTransition,
  measureAnimationPerformance,
  handleKeyboardNavigation,
  announceToScreenReader,
  manageFocus,
  createFocusVisibleStyles,
  createAccessibleHoverStyles,
} from '../../constants';
import { withAnimationErrorBoundary } from '../common/AnimationErrorBoundary';

interface DesktopFooterNavigationProps {
  visible: boolean;
  onNavigate?: (path: string) => void;
}

const DesktopFooterNavigationComponent: React.FC<
  DesktopFooterNavigationProps
> = ({ visible, onNavigate }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const footerItems = getFooterNavigationItems();
  const mountedRef = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use adaptive animation configuration for better performance
  const adaptiveAnimationConfig = React.useMemo(
    () => getAdaptiveAnimationConfig(),
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Enhanced focus management and screen reader announcements
  useEffect(() => {
    if (visible && containerRef.current) {
      // Announce footer navigation availability to screen readers
      announceToScreenReader(
        'Footer navigation is now available. Use Tab to navigate between options.',
        'polite'
      );

      // Only auto-focus if no other element currently has focus
      const activeElement = document.activeElement;
      if (!activeElement || activeElement === document.body) {
        const firstButton = manageFocus.findFirstFocusable(
          containerRef.current
        );
        if (firstButton) {
          // Use a small delay to ensure the animation has started
          setTimeout(() => {
            firstButton.focus();
          }, 100);
        }
      }
    } else if (!visible) {
      // Announce when footer navigation is hidden
      announceToScreenReader(
        'Footer navigation is no longer available.',
        'polite'
      );
    }
  }, [visible]);

  const handleNavigation = (path: string) => {
    if (!mountedRef.current) return;

    measureAnimationPerformance('footer-navigation', () => {
      if (onNavigate) {
        onNavigate(path);
      }
      navigate(path);
    });
  };

  const handleKeyDown = (
    event: React.KeyboardEvent,
    path: string,
    itemText: string
  ) => {
    // Enhanced keyboard navigation with arrow key support
    handleKeyboardNavigation(
      event.nativeEvent,
      () => {
        handleNavigation(path);
        announceToScreenReader(`Navigating to ${itemText}`, 'assertive');
      },
      { keys: ['Enter', ' '] }
    );

    // Handle arrow key navigation within footer
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const buttons = containerRef.current?.querySelectorAll(
        'button:not([disabled])'
      );
      if (!buttons) return;

      const currentIndex = Array.from(buttons).indexOf(
        event.currentTarget as HTMLButtonElement
      );
      let nextIndex: number;

      if (event.key === 'ArrowLeft') {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1;
      } else {
        nextIndex = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0;
      }

      (buttons[nextIndex] as HTMLButtonElement).focus();
    }
  };

  // Enhanced responsive behavior - don't render on mobile devices with better breakpoint handling
  if (isMobile) {
    return null;
  }

  // Additional safety check for edge cases during breakpoint transitions
  if (typeof window !== 'undefined' && window.innerWidth < 900) {
    return null;
  }

  return (
    <Slide
      direction="up"
      in={visible}
      timeout={{
        enter: getAnimationDuration(adaptiveAnimationConfig.duration.footer),
        exit: getAnimationDuration(adaptiveAnimationConfig.duration.footer),
      }}
      easing={{
        enter: adaptiveAnimationConfig.easing.enter,
        exit: adaptiveAnimationConfig.easing.exit,
      }}
      mountOnEnter
      unmountOnExit
    >
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar - 1,
          backgroundColor: theme.palette.background.paper,
          borderTop: `1px solid ${theme.palette.divider}`,
          borderRadius: 0,
          py: 1,
          px: 2,
          // Enhanced responsive behavior with better breakpoint handling
          display: { xs: 'none', md: 'block' },
          // Additional responsive safety measures
          '@media (max-width: 899px)': {
            display: 'none !important',
          },
          '@media (min-width: 900px)': {
            display: 'block',
          },
          // Performance optimizations
          willChange: visible ? 'transform' : 'auto',
          // Use GPU acceleration for smoother animations
          backfaceVisibility: 'hidden',
          perspective: 1000,
        }}
        // Enhanced accessibility attributes
        role="navigation"
        aria-label="Desktop footer navigation"
        aria-describedby="footer-nav-description"
      >
        {/* Hidden description for screen readers */}
        <div
          id="footer-nav-description"
          style={{
            position: 'absolute',
            left: '-10000px',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
          }}
        >
          Use arrow keys to navigate between options, Enter or Space to select
        </div>

        <Box
          ref={containerRef}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1,
            maxWidth: '600px',
            margin: '0 auto',
          }}
          role="menubar"
          aria-orientation="horizontal"
          onKeyDown={(event) => {
            // Handle focus trapping within the footer navigation
            if (event.key === 'Tab' && containerRef.current) {
              manageFocus.trapFocus(containerRef.current, event.nativeEvent);
            }
          }}
        >
          {footerItems.map((item) => {
            const isActive = isNavigationItemActive(item, location.pathname);

            return (
              <Box
                key={item.path}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '80px',
                }}
              >
                <IconButton
                  component={Link}
                  to={item.path}
                  onClick={() => handleNavigation(item.path)}
                  onKeyDown={(event) =>
                    handleKeyDown(event, item.path, item.text)
                  }
                  disabled={item.disabled}
                  sx={{
                    color: isActive
                      ? theme.palette.primary.main
                      : theme.palette.text.secondary,
                    backgroundColor: isActive
                      ? alpha(theme.palette.primary.main, 0.1)
                      : 'transparent',
                    minWidth: '48px',
                    minHeight: '48px',
                    ...createOptimizedTransition(
                      ['color', 'background-color', 'transform'],
                      getAnimationDuration(
                        adaptiveAnimationConfig.duration.iconTransition
                      ),
                      adaptiveAnimationConfig.easing.enter
                    ),
                    ...createFocusVisibleStyles(theme.palette.primary.main),
                    ...createAccessibleHoverStyles(
                      isActive
                        ? alpha(theme.palette.primary.main, 0.15)
                        : alpha(theme.palette.action.hover, 0.08),
                      'translateY(-2px)'
                    ),
                    '&:active': {
                      transform: 'translateY(0px)',
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
                      },
                    },
                    mb: 0.5,
                  }}
                  aria-label={`Navigate to ${item.text}${isActive ? ' (current page)' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  aria-describedby={`${item.path}-description`}
                  role="menuitem"
                  tabIndex={0}
                >
                  {item.icon}
                </IconButton>
                <Typography
                  variant="caption"
                  sx={{
                    color: isActive
                      ? theme.palette.primary.main
                      : theme.palette.text.secondary,
                    fontSize: '0.75rem',
                    fontWeight: isActive ? 600 : 400,
                    ...createOptimizedTransition(
                      ['color', 'font-weight'],
                      getAnimationDuration(
                        adaptiveAnimationConfig.duration.iconTransition
                      ),
                      adaptiveAnimationConfig.easing.enter
                    ),
                    textAlign: 'center',
                    lineHeight: 1.2, // Improved line height for readability
                    // Ensure text meets contrast requirements
                    '@media (prefers-contrast: high)': {
                      fontWeight: isActive ? 700 : 500,
                    },
                  }}
                  aria-hidden="true" // Hide from screen readers since button has aria-label
                >
                  {item.text}
                </Typography>

                {/* Hidden description for screen readers */}
                <div
                  id={`${item.path}-description`}
                  style={{
                    position: 'absolute',
                    left: '-10000px',
                    width: '1px',
                    height: '1px',
                    overflow: 'hidden',
                  }}
                >
                  {`Navigate to ${item.text} page`}
                </div>
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Slide>
  );
};

// Export with animation error boundary
export const DesktopFooterNavigation = withAnimationErrorBoundary(
  DesktopFooterNavigationComponent,
  'footer-navigation',
  'DesktopFooterNavigation'
);
