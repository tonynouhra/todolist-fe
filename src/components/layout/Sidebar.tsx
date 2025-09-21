import React, { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  useTheme,
} from '@mui/material';
import {
  animationConfig,
  createTransition,
  createOptimizedTransition,
  createStaggeredContentTransition,
  getAdaptiveAnimationConfig,
  getAllNavigationItems,
  getSecondaryNavigationItems,
  isNavigationItemActive,
  measureAnimationPerformance,
  safeAnimationExecution,
} from '../../constants';
import { withAnimationErrorBoundary } from '../common/AnimationErrorBoundary';

interface SidebarProps {
  open: boolean;
  width: number;
  onClose: () => void;
  variant?: 'permanent' | 'temporary';
  onTransitionStart?: () => void;
  onTransitionEnd?: () => void;
}

const SidebarComponent: React.FC<SidebarProps> = ({
  open,
  width,
  onClose,
  variant = 'permanent',
  onTransitionStart,
  onTransitionEnd,
}) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const previousOpenRef = useRef(open);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use adaptive animation configuration for better performance
  const adaptiveAnimationConfig = React.useMemo(
    () => getAdaptiveAnimationConfig(),
    []
  );

  // Get navigation items from shared configuration
  const navigationItems = getAllNavigationItems();
  const secondaryItems = getSecondaryNavigationItems();

  // Enhanced transition callback handling with improved timing
  useEffect(() => {
    const wasOpen = previousOpenRef.current;
    const isOpen = open;

    // Only trigger callbacks if the open state actually changed
    if (wasOpen !== isOpen) {
      // Clear any existing timeout
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      // Call transition start callback immediately
      if (onTransitionStart) {
        // Use requestAnimationFrame for better timing
        requestAnimationFrame(() => {
          onTransitionStart();
        });
      }

      // Calculate appropriate duration based on variant and animation config
      const baseDuration = adaptiveAnimationConfig.duration.sidebar;
      const contentDelay = open ? 120 : 0; // Account for staggered content animations
      const totalDuration = baseDuration + contentDelay + 50; // Add buffer for smooth completion

      // Set timeout for transition end callback with improved timing
      transitionTimeoutRef.current = setTimeout(() => {
        if (onTransitionEnd) {
          // Use requestAnimationFrame to ensure callback runs after paint
          requestAnimationFrame(() => {
            onTransitionEnd();
          });
        }
        transitionTimeoutRef.current = null;
      }, totalDuration);
    }

    previousOpenRef.current = open;

    // Cleanup timeout on unmount
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [
    open,
    onTransitionStart,
    onTransitionEnd,
    variant,
    adaptiveAnimationConfig.duration.sidebar,
  ]);

  const handleNavigation = (path: string, disabled?: boolean) => {
    if (disabled) return;

    measureAnimationPerformance('sidebar-navigation', async () => {
      await safeAnimationExecution(
        () => {
          navigate(path);
          if (variant === 'temporary') {
            onClose();
          }
        },
        'navigation',
        'Sidebar'
      );
    });
  };

  const drawerContent = (
    <Box
      component="nav"
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      aria-label="Main navigation"
      id="navigation-menu"
    >
      {/* Toolbar spacer for permanent drawer */}
      {variant === 'permanent' && (
        <Box sx={{ height: theme.mixins.toolbar.minHeight }} />
      )}

      {/* Logo/Brand area for temporary drawer */}
      {variant === 'temporary' && (
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            TodoList
          </Typography>
        </Box>
      )}

      {/* Main navigation */}
      <List
        sx={{ flexGrow: 1, pt: 2 }}
        role="menu"
        aria-label="Primary navigation"
      >
        {navigationItems.map((item, index) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={isNavigationItemActive(item, location.pathname)}
              onClick={() => handleNavigation(item.path, item.disabled)}
              disabled={item.disabled}
              sx={{
                mx: 1,
                borderRadius: 1,
                // Enhanced hover and transition effects
                ...createOptimizedTransition(
                  ['background-color', 'color', 'transform'],
                  adaptiveAnimationConfig.duration.iconTransition,
                  adaptiveAnimationConfig.easing.sharp
                ),
                '&:hover': {
                  transform: 'translateX(2px)',
                  '& .MuiListItemIcon-root': {
                    ...createOptimizedTransition(
                      'transform',
                      adaptiveAnimationConfig.duration.iconTransition,
                      adaptiveAnimationConfig.easing.sharp
                    ),
                    transform: 'scale(1.05)',
                  },
                },
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  transform: 'translateX(4px)',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                    transform: 'translateX(4px)',
                  },
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.contrastText,
                    transform: 'scale(1.1)',
                  },
                },
                '&.Mui-disabled': {
                  opacity: 0.5,
                },
                '&:focus-visible': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: '2px',
                },
                // Enhanced staggered animation for smoother appearance
                ...createStaggeredContentTransition(
                  ['opacity', 'transform'],
                  index,
                  variant === 'permanent' && open
                ),
                // Reduced motion support
                '@media (prefers-reduced-motion: reduce)': {
                  transition: 'none !important',
                  animationDelay: '0ms !important',
                  '&:hover': {
                    transform: 'none !important',
                    '& .MuiListItemIcon-root': {
                      transform: 'none !important',
                    },
                  },
                  '&.Mui-selected': {
                    transform: 'none !important',
                    '&:hover': {
                      transform: 'none !important',
                    },
                    '& .MuiListItemIcon-root': {
                      transform: 'none !important',
                    },
                  },
                },
              }}
              role="menuitem"
              aria-current={
                isNavigationItemActive(item, location.pathname)
                  ? 'page'
                  : undefined
              }
              tabIndex={0}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: isNavigationItemActive(item, location.pathname)
                    ? 'inherit'
                    : 'action.active',
                  ...createOptimizedTransition(
                    ['color', 'transform'],
                    adaptiveAnimationConfig.duration.iconTransition,
                    adaptiveAnimationConfig.easing.sharp
                  ),
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                slotProps={{
                  primary: {
                    fontSize: '0.875rem',
                    fontWeight: isNavigationItemActive(item, location.pathname)
                      ? 600
                      : 400,
                  },
                }}
                sx={{
                  '& .MuiTypography-root': {
                    ...createOptimizedTransition(
                      'font-weight',
                      adaptiveAnimationConfig.duration.iconTransition,
                      adaptiveAnimationConfig.easing.sharp
                    ),
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Secondary navigation */}
      <Box>
        <Divider
          sx={{
            mx: 2,
            transition: createTransition(
              'opacity',
              animationConfig.duration.content,
              animationConfig.easing.enter
            ),
          }}
        />
        <List role="menu" aria-label="Secondary navigation">
          {secondaryItems.map((item, index) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={isNavigationItemActive(item, location.pathname)}
                onClick={() => handleNavigation(item.path, item.disabled)}
                disabled={item.disabled}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  // Enhanced hover and transition effects
                  ...createOptimizedTransition(
                    ['background-color', 'color', 'transform'],
                    adaptiveAnimationConfig.duration.iconTransition,
                    adaptiveAnimationConfig.easing.sharp
                  ),
                  '&:hover': {
                    transform: 'translateX(2px)',
                    '& .MuiListItemIcon-root': {
                      ...createOptimizedTransition(
                        'transform',
                        adaptiveAnimationConfig.duration.iconTransition,
                        adaptiveAnimationConfig.easing.sharp
                      ),
                      transform: 'scale(1.05)',
                    },
                  },
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    transform: 'translateX(4px)',
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                      transform: 'translateX(4px)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: theme.palette.primary.contrastText,
                      transform: 'scale(1.1)',
                    },
                  },
                  '&.Mui-disabled': {
                    opacity: 0.5,
                  },
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: '2px',
                  },
                  // Enhanced staggered animation for secondary items
                  ...createStaggeredContentTransition(
                    ['opacity', 'transform'],
                    navigationItems.length + index,
                    variant === 'permanent' && open
                  ),
                  // Reduced motion support
                  '@media (prefers-reduced-motion: reduce)': {
                    transition: 'none !important',
                    animationDelay: '0ms !important',
                    '&:hover': {
                      transform: 'none !important',
                      '& .MuiListItemIcon-root': {
                        transform: 'none !important',
                      },
                    },
                    '&.Mui-selected': {
                      transform: 'none !important',
                      '&:hover': {
                        transform: 'none !important',
                      },
                      '& .MuiListItemIcon-root': {
                        transform: 'none !important',
                      },
                    },
                  },
                }}
                role="menuitem"
                aria-current={
                  isNavigationItemActive(item, location.pathname)
                    ? 'page'
                    : undefined
                }
                tabIndex={0}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isNavigationItemActive(item, location.pathname)
                      ? 'inherit'
                      : 'action.active',
                    ...createOptimizedTransition(
                      ['color', 'transform'],
                      adaptiveAnimationConfig.duration.iconTransition,
                      adaptiveAnimationConfig.easing.sharp
                    ),
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  slotProps={{
                    primary: {
                      fontSize: '0.875rem',
                      fontWeight: isNavigationItemActive(
                        item,
                        location.pathname
                      )
                        ? 600
                        : 400,
                    },
                  }}
                  sx={{
                    '& .MuiTypography-root': {
                      ...createOptimizedTransition(
                        'font-weight',
                        adaptiveAnimationConfig.duration.iconTransition,
                        adaptiveAnimationConfig.easing.sharp
                      ),
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );

  // For permanent drawer, we need to handle the open state differently
  // since MUI's permanent drawer doesn't support the open prop
  if (variant === 'permanent') {
    return (
      <Box
        sx={{
          width: open ? width : 0,
          flexShrink: 0,
          // Enhanced transition with custom easing for smoother visual flow
          ...createOptimizedTransition(
            'width',
            adaptiveAnimationConfig.duration.sidebar,
            open
              ? 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' // Custom ease-out for opening
              : 'cubic-bezier(0.55, 0.06, 0.68, 0.19)' // Custom ease-in for closing
          ),
          // Performance optimizations for smooth animations
          willChange: open ? 'width' : 'auto', // Only set willChange when needed
          backfaceVisibility: 'hidden',
          overflow: 'hidden',
          // Ensure sidebar remains fixed during scrolling
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: theme.zIndex.drawer,
          // Improve visual flow with enhanced shadow and border handling
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '1px',
            height: '100%',
            backgroundColor: theme.palette.divider,
            opacity: open ? 1 : 0,
            ...createOptimizedTransition(
              'opacity',
              adaptiveAnimationConfig.duration.sidebar * 0.7,
              'cubic-bezier(0.4, 0, 0.2, 1)'
            ),
          },
        }}
      >
        <Drawer
          variant="permanent"
          sx={{
            width: width,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: width,
              boxSizing: 'border-box',
              border: 'none', // Remove default border, use custom one
              position: 'static', // Let parent handle positioning
              height: '100%',
              // Enhanced visual styling for better flow
              backgroundColor: theme.palette.background.paper,
              // Improved shadow handling for better visual integration
              boxShadow: open ? theme.shadows[2] : 'none',
              ...createOptimizedTransition(
                ['box-shadow'],
                adaptiveAnimationConfig.duration.sidebar * 0.8,
                'cubic-bezier(0.4, 0, 0.2, 1)',
                open ? 100 : 0 // Delay shadow appearance when opening
              ),
              // Enhanced content transitions with staggered animations
              '& .MuiList-root': {
                ...createOptimizedTransition(
                  ['opacity', 'transform'],
                  adaptiveAnimationConfig.duration.content * 0.9,
                  'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  open ? 120 : 0 // Staggered delay for content appearance
                ),
                opacity: open ? 1 : 0,
                transform: open ? 'translateX(0)' : 'translateX(-8px)',
              },
              // Smooth divider transitions
              '& .MuiDivider-root': {
                ...createOptimizedTransition(
                  'opacity',
                  adaptiveAnimationConfig.duration.content * 0.6,
                  'cubic-bezier(0.4, 0, 0.2, 1)',
                  open ? 150 : 0
                ),
                opacity: open ? 1 : 0,
              },
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>
    );
  }

  // For temporary drawer (mobile)
  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: width,
          boxSizing: 'border-box',
          borderRight: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          // Ensure mobile drawer is fixed during scrolling
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          // Enhanced mobile drawer animations with custom easing
          '& .MuiList-root': {
            ...createOptimizedTransition(
              ['opacity', 'transform'],
              adaptiveAnimationConfig.duration.content * 0.8,
              'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Custom ease-out
              open ? 80 : 0 // Staggered delay for mobile content
            ),
            opacity: open ? 1 : 0,
            transform: open ? 'translateX(0)' : 'translateX(-12px)',
          },
          // Enhanced divider animations for mobile
          '& .MuiDivider-root': {
            ...createOptimizedTransition(
              'opacity',
              adaptiveAnimationConfig.duration.content * 0.5,
              'cubic-bezier(0.4, 0, 0.2, 1)',
              open ? 120 : 0
            ),
            opacity: open ? 1 : 0,
          },
        },
      }}
      // Enhanced transition props with custom easing for smoother mobile animations
      transitionDuration={{
        enter: adaptiveAnimationConfig.duration.sidebar,
        exit: adaptiveAnimationConfig.duration.sidebar * 0.75, // Faster exit for better UX
      }}
      slotProps={{
        backdrop: {
          sx: {
            // Enhanced backdrop animation with custom easing
            ...createOptimizedTransition(
              'opacity',
              adaptiveAnimationConfig.duration.sidebar * 0.7,
              'cubic-bezier(0.4, 0, 0.2, 1)'
            ),
            // Ensure backdrop doesn't interfere with scrolling
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          },
        },
      }}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile
        // Prevent body scroll when drawer is open
        disableScrollLock: false,
        // Enhanced focus management
        disableAutoFocus: false,
        disableEnforceFocus: false,
        disableRestoreFocus: false,
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

// Export with animation error boundary
export const Sidebar = withAnimationErrorBoundary(
  SidebarComponent,
  'sidebar-animation',
  'Sidebar'
);
