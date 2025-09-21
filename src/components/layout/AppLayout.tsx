import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNavigation } from './MobileNavigation';
import { DesktopFooterNavigation } from './DesktopFooterNavigation';
import { AddTodoFAB } from '../ui/AddTodoFAB';
import {
  getAnimationDuration,
  getAdaptiveAnimationConfig,
  createOptimizedTransition,
  measureAnimationPerformance,
  safeAnimationExecution,
} from '../../constants/animations';
import { AnimationErrorBoundary } from '../common/AnimationErrorBoundary';

interface AppLayoutProps {
  children: React.ReactNode;
}

interface LayoutState {
  sidebarOpen: boolean;
  isTransitioning: boolean;
  showDesktopFooter: boolean;
  previousIsMobile: boolean;
  transitionType: 'sidebar' | 'footer' | 'breakpoint' | null;
}

// Helper function to determine transition duration based on type
const getTransitionDuration = (
  transitionType: LayoutState['transitionType'],
  adaptiveConfig: ReturnType<typeof getAdaptiveAnimationConfig>
): number => {
  switch (transitionType) {
    case 'sidebar':
      return adaptiveConfig.duration.sidebar;
    case 'footer':
      return adaptiveConfig.duration.footer;
    default:
      return adaptiveConfig.duration.content;
  }
};

// Helper function to determine will-change properties based on transition type
const getWillChangeProperties = (
  transitionType: LayoutState['transitionType'],
  isTransitioning: boolean
): string => {
  if (!isTransitioning) return 'auto';

  switch (transitionType) {
    case 'sidebar':
      return 'transform, width, max-width, margin';
    case 'footer':
      return 'padding-bottom';
    default:
      return 'transform, width, padding-bottom, max-width, margin';
  }
};

let persistedLayoutState: Pick<
  LayoutState,
  'sidebarOpen' | 'showDesktopFooter'
> | null = null;

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();

  // Use adaptive animation configuration for better performance
  const adaptiveAnimationConfig = React.useMemo(
    () => getAdaptiveAnimationConfig(),
    []
  );

  // Refs for cleanup and focus management
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const footerDelayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const breakpointTransitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const mainContentRef = useRef<HTMLElement | null>(null);

  // Enhanced state management with breakpoint tracking
  const initialLayoutState = React.useMemo<LayoutState>(() => {
    if (persistedLayoutState) {
      return {
        sidebarOpen: persistedLayoutState.sidebarOpen ?? !isMobile,
        showDesktopFooter: persistedLayoutState.showDesktopFooter ?? false,
        isTransitioning: false,
        previousIsMobile: isMobile,
        transitionType: null,
      };
    }
    return {
      sidebarOpen: !isMobile,
      isTransitioning: false,
      showDesktopFooter: false,
      previousIsMobile: isMobile,
      transitionType: null,
    };
  }, [isMobile]);

  const [layoutStateBase, setLayoutStateBase] =
    useState<LayoutState>(initialLayoutState);

  const layoutState = layoutStateBase;

  const setLayoutState = useCallback(
    (updater: React.SetStateAction<LayoutState>) => {
      setLayoutStateBase((prev) => {
        const next =
          typeof updater === 'function'
            ? (updater as (prev: LayoutState) => LayoutState)(prev)
            : updater;

        persistedLayoutState = {
          sidebarOpen: next.sidebarOpen,
          showDesktopFooter: next.showDesktopFooter,
        };

        return next;
      });
    },
    []
  );

  const sidebarWidth = 280;

  // Memoized layout calculations for better performance
  const layoutCalculations = React.useMemo(() => {
    const headerHeight = { xs: 56, sm: 64 };
    const footerHeight = 64;
    const contentPadding = { xs: 12, sm: 16 }; // Reduced for minimal gaps

    return {
      headerHeight,
      footerHeight,
      contentPadding,
      // Main content positioning - improved centering logic
      mainContentTransform:
        !isMobile && layoutState.sidebarOpen
          ? `translateX(${sidebarWidth}px)`
          : 'translateX(0)',
      mainContentWidth:
        !isMobile && layoutState.sidebarOpen
          ? `calc(100% - ${sidebarWidth}px)`
          : '100%',
      // Add centering properties for when sidebar is closed
      mainContentMaxWidth:
        !isMobile && !layoutState.sidebarOpen ? '1200px' : 'none',
      mainContentMargin: !isMobile && !layoutState.sidebarOpen ? '0 auto' : '0',
      // Padding calculations with comfortable spacing from header
      paddingTop: `${headerHeight.xs + 16}px`, // Mobile header height + comfortable spacing
      paddingTopDesktop: `${headerHeight.sm + 16}px`, // Desktop header height + comfortable spacing
      paddingBottom: layoutState.showDesktopFooter
        ? `${footerHeight + 16}px` // Footer height + comfortable spacing
        : `${contentPadding.xs + 8}px`, // Comfortable bottom padding when no footer
    };
  }, [
    isMobile,
    layoutState.sidebarOpen,
    layoutState.showDesktopFooter,
    sidebarWidth,
  ]);

  // Enhanced breakpoint change handling with improved transition logic and smoother responsive behavior
  const handleBreakpointChange = useCallback(() => {
    if (layoutState.previousIsMobile === isMobile) return;

    // Clear any existing timers to prevent conflicts and ensure clean state transitions
    if (breakpointTransitionTimerRef.current) {
      clearTimeout(breakpointTransitionTimerRef.current);
    }
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }
    if (footerDelayTimerRef.current) {
      clearTimeout(footerDelayTimerRef.current);
    }

    // Improved breakpoint transition logic with better state coordination
    const isMovingToMobile = !layoutState.previousIsMobile && isMobile;
    const isMovingToDesktop = layoutState.previousIsMobile && !isMobile;

    // Set transitioning state with enhanced coordination to prevent conflicts during breakpoint change
    setLayoutState((prev) => ({
      ...prev,
      isTransitioning: true,
      previousIsMobile: isMobile,
      transitionType: 'breakpoint',
      // Immediately hide footer during breakpoint transitions to prevent layout conflicts
      showDesktopFooter: false,
    }));

    // Enhanced breakpoint transition with adaptive timing based on transition direction
    const breakpointTransitionDelay = getAnimationDuration(
      isMovingToMobile
        ? adaptiveAnimationConfig.duration.content * 0.2 // Faster transition to mobile
        : adaptiveAnimationConfig.duration.content * 0.4 // Slightly longer for desktop to allow proper layout
    );

    breakpointTransitionTimerRef.current = setTimeout(() => {
      setLayoutState((prev) => ({
        ...prev,
        sidebarOpen: !isMobile, // Open sidebar on desktop, close on mobile
        isTransitioning: false,
        transitionType: null,
        // Don't immediately show footer - let the footer visibility logic handle it
        showDesktopFooter: false,
      }));

      // Additional cleanup and focus management for better accessibility
      if (isMovingToDesktop && mainContentRef.current) {
        // Ensure main content is properly positioned after desktop transition
        mainContentRef.current.style.pointerEvents = 'auto';
      }
    }, breakpointTransitionDelay);
  }, [
    isMobile,
    layoutState.previousIsMobile,
    adaptiveAnimationConfig.duration.content,
    setLayoutState,
  ]);

  useEffect(() => {
    handleBreakpointChange();
  }, [handleBreakpointChange]);

  // Ensure mobile sidebar closes after navigation changes to avoid reopening
  useEffect(() => {
    if (isMobile && layoutState.sidebarOpen) {
      setLayoutState((prev) => ({ ...prev, sidebarOpen: false }));
    }
  }, [isMobile, layoutState.sidebarOpen, location.pathname, setLayoutState]);

  // Enhanced window resize handling for smooth responsive behavior during screen size changes
  useEffect(() => {
    let resizeTimeoutId: NodeJS.Timeout | null = null;
    let orientationChangeTimeoutId: NodeJS.Timeout | null = null;

    const handleResize = () => {
      // Clear existing timeout to debounce resize events
      if (resizeTimeoutId) {
        clearTimeout(resizeTimeoutId);
      }

      // Debounce resize handling to prevent excessive state updates
      resizeTimeoutId = setTimeout(() => {
        // Force a re-evaluation of breakpoint state after resize
        const currentIsMobile = window.innerWidth < theme.breakpoints.values.md; // Use theme breakpoint

        if (currentIsMobile !== isMobile) {
          // Trigger breakpoint change if the computed mobile state differs from current
          // This handles edge cases where useMediaQuery might not update immediately
          setLayoutState((prev) => ({
            ...prev,
            previousIsMobile: !currentIsMobile, // Force breakpoint change detection
          }));
        }

        // Ensure layout stability after resize
        if (mainContentRef.current) {
          mainContentRef.current.style.pointerEvents = 'auto';

          // Reset any stuck transition states that might occur during resize
          if (
            layoutState.isTransitioning &&
            layoutState.transitionType === 'breakpoint'
          ) {
            setTimeout(() => {
              setLayoutState((prev) => ({
                ...prev,
                isTransitioning: false,
                transitionType: null,
              }));
            }, 100);
          }
        }
      }, 150); // Debounce delay for smooth performance
    };

    // Enhanced orientation change handling for mobile devices
    const handleOrientationChange = () => {
      // Clear existing timeout
      if (orientationChangeTimeoutId) {
        clearTimeout(orientationChangeTimeoutId);
      }

      // Handle orientation change with additional delay for mobile browsers
      orientationChangeTimeoutId = setTimeout(() => {
        // Force layout recalculation after orientation change
        const currentIsMobile = window.innerWidth < theme.breakpoints.values.md;

        // Update layout state if needed
        if (currentIsMobile !== isMobile) {
          setLayoutState((prev) => ({
            ...prev,
            previousIsMobile: !currentIsMobile,
            // Reset transition state to prevent stuck animations
            isTransitioning: false,
            transitionType: null,
          }));
        }

        // Ensure proper layout after orientation change
        if (mainContentRef.current) {
          mainContentRef.current.style.pointerEvents = 'auto';
          mainContentRef.current.style.willChange = 'auto';
        }
      }, 300); // Longer delay for orientation changes
    };

    // Add event listeners with passive option for better performance
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleOrientationChange, {
      passive: true,
    });

    // Enhanced cleanup function with comprehensive timer management
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);

      if (resizeTimeoutId) {
        clearTimeout(resizeTimeoutId);
        resizeTimeoutId = null;
      }
      if (orientationChangeTimeoutId) {
        clearTimeout(orientationChangeTimeoutId);
        orientationChangeTimeoutId = null;
      }
    };
  }, [
    isMobile,
    layoutState.isTransitioning,
    layoutState.transitionType,
    theme.breakpoints.values.md,
    setLayoutState,
  ]);

  // Enhanced footer visibility management with improved responsive behavior and better breakpoint handling
  const updateFooterVisibility = useCallback(() => {
    // Clear any existing footer delay timer to prevent conflicts
    if (footerDelayTimerRef.current) {
      clearTimeout(footerDelayTimerRef.current);
    }

    // Enhanced logic with strict desktop-only footer visibility: Only show footer on desktop when sidebar is closed and not transitioning
    const shouldShowFooter =
      !isMobile && // Must be desktop
      !layoutState.sidebarOpen && // Sidebar must be closed
      !layoutState.isTransitioning && // No ongoing transitions
      layoutState.transitionType !== 'breakpoint' && // Don't show during breakpoint transitions
      layoutState.previousIsMobile === isMobile && // Ensure breakpoint transition is complete
      window.innerWidth >= theme.breakpoints.values.md; // Double-check window width for edge cases

    // Early return if no change needed to prevent unnecessary state updates
    if (shouldShowFooter === layoutState.showDesktopFooter) return;

    const footerTransitionDuration = getAnimationDuration(
      adaptiveAnimationConfig.duration.footer
    );

    if (shouldShowFooter) {
      // Enhanced delay logic for showing footer with improved responsive timing
      const showDelay = getAnimationDuration(
        // Adaptive delay based on previous state for smoother transitions
        layoutState.transitionType === 'breakpoint'
          ? adaptiveAnimationConfig.delays.footerShow * 3 // Longer delay after breakpoint changes
          : layoutState.previousIsMobile !== isMobile
            ? adaptiveAnimationConfig.delays.footerShow * 2 // Medium delay during responsive transitions
            : adaptiveAnimationConfig.delays.footerShow // Normal delay for regular transitions
      );

      footerDelayTimerRef.current = setTimeout(() => {
        // Enhanced condition checking with responsive state validation and additional safety checks
        if (
          !isMobile &&
          !layoutState.sidebarOpen &&
          !layoutState.isTransitioning &&
          layoutState.previousIsMobile === isMobile && // Ensure responsive transition is stable
          window.innerWidth >= theme.breakpoints.values.md // Additional safety check
        ) {
          setLayoutState((prev) => ({
            ...prev,
            showDesktopFooter: true,
            transitionType: 'footer',
          }));

          // Clear footer transition type after animation completes with proper cleanup
          setTimeout(() => {
            setLayoutState((prev) => ({
              ...prev,
              transitionType:
                prev.transitionType === 'footer' ? null : prev.transitionType,
            }));
          }, footerTransitionDuration);
        }
      }, showDelay);
    } else {
      // Hide footer immediately with proper transition state and responsive coordination
      setLayoutState((prev) => ({
        ...prev,
        showDesktopFooter: false,
        transitionType:
          prev.transitionType === 'breakpoint' ? 'breakpoint' : 'footer',
      }));

      // Clear footer transition type after animation completes with enhanced cleanup
      setTimeout(() => {
        setLayoutState((prev) => ({
          ...prev,
          transitionType:
            prev.transitionType === 'footer' ? null : prev.transitionType,
        }));
      }, footerTransitionDuration);
    }
  }, [
    isMobile,
    layoutState.sidebarOpen,
    layoutState.isTransitioning,
    layoutState.showDesktopFooter,
    layoutState.transitionType,
    layoutState.previousIsMobile,
    adaptiveAnimationConfig.delays.footerShow,
    adaptiveAnimationConfig.duration.footer,
    theme.breakpoints.values.md,
    setLayoutState,
  ]);

  useEffect(() => {
    updateFooterVisibility();
  }, [updateFooterVisibility]);

  // Enhanced sidebar toggle with improved transition state management and coordination
  const handleSidebarToggle = useCallback(() => {
    if (layoutState.isTransitioning) {
      return; // Prevent multiple simultaneous transitions
    }

    const executeSidebarToggle = () => {
      // Store current focus for restoration after transition
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Clear any existing timers to prevent conflicts
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
      if (footerDelayTimerRef.current) {
        clearTimeout(footerDelayTimerRef.current);
      }

      const newSidebarOpen = !layoutState.sidebarOpen;

      setLayoutState((prev) => ({
        ...prev,
        sidebarOpen: newSidebarOpen,
        isTransitioning: true,
        transitionType: 'sidebar',
        // Enhanced footer coordination: hide immediately when opening sidebar,
        // but let the useEffect handle showing when closing
        showDesktopFooter: newSidebarOpen ? false : prev.showDesktopFooter,
      }));
    };

    const fallbackSidebarToggle = () => {
      // Enhanced fallback: Ensure proper state even without animation
      const newSidebarOpen = !layoutState.sidebarOpen;
      setLayoutState((prev) => ({
        ...prev,
        sidebarOpen: newSidebarOpen,
        isTransitioning: false,
        transitionType: null,
        showDesktopFooter: !isMobile && !newSidebarOpen,
      }));
    };

    measureAnimationPerformance('sidebar-toggle', async () => {
      await safeAnimationExecution(
        executeSidebarToggle,
        'sidebar-toggle',
        'AppLayout',
        fallbackSidebarToggle
      );
    });
  }, [
    layoutState.isTransitioning,
    layoutState.sidebarOpen,
    isMobile,
    setLayoutState,
  ]);

  // Enhanced transition management with proper cleanup and focus restoration
  const manageTransitionState = useCallback(() => {
    if (!layoutState.isTransitioning) return;

    // Clear any existing timer
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }

    const transitionDuration = getTransitionDuration(
      layoutState.transitionType,
      adaptiveAnimationConfig
    );

    transitionTimerRef.current = setTimeout(() => {
      setLayoutState((prev) => ({
        ...prev,
        isTransitioning: false,
        transitionType: null,
      }));

      // Restore focus after transition completes, but only if focus hasn't moved elsewhere
      if (
        previousFocusRef.current &&
        document.activeElement === document.body &&
        previousFocusRef.current.isConnected
      ) {
        previousFocusRef.current.focus();
      }
      previousFocusRef.current = null;
    }, getAnimationDuration(transitionDuration));
  }, [
    layoutState.isTransitioning,
    layoutState.transitionType,
    adaptiveAnimationConfig,
    setLayoutState,
  ]);

  useEffect(() => {
    manageTransitionState();
  }, [manageTransitionState]);

  // Handle Add Todo FAB click
  const handleAddTodoClick = useCallback(() => {
    console.log('FAB clicked, current path:', location.pathname);

    // Create a custom event that can be listened to by the TodosPage or other components
    const addTodoEvent = new CustomEvent('addTodoRequested', {
      bubbles: true,
      detail: { source: 'fab' },
    });

    // If not on todos page, navigate there first
    if (location.pathname !== '/todos') {
      console.log('Navigating to todos page');
      navigate('/todos');
      // Use a slight delay to allow navigation to complete before triggering the event
      setTimeout(() => {
        console.log('Dispatching event after navigation');
        document.dispatchEvent(addTodoEvent);
      }, 100);
    } else {
      // Dispatch the event immediately if already on todos page
      console.log('Dispatching event immediately');
      document.dispatchEvent(addTodoEvent);
    }
  }, [location.pathname, navigate]);

  // Only show FAB on todos page
  const shouldShowFAB = !isMobile && location.pathname === '/todos';

  const handleFooterNavigate = useCallback(() => {
    setLayoutState((prev) => ({
      ...prev,
      sidebarOpen: false,
      showDesktopFooter: true,
    }));
  }, [setLayoutState]);

  // Debug logging
  console.log('AppLayout render:', {
    isMobile,
    pathname: location.pathname,
    shouldShowFAB,
  });

  // Enhanced cleanup for animation timers during component unmount with comprehensive timer management
  useEffect(() => {
    // Store refs in variables to ensure they're accessible in cleanup
    const transitionTimer = transitionTimerRef;
    const footerDelayTimer = footerDelayTimerRef;
    const breakpointTransitionTimer = breakpointTransitionTimerRef;
    const mainContent = mainContentRef;
    const previousFocus = previousFocusRef;

    return () => {
      // Clear all animation timers to prevent memory leaks and state updates after unmount
      if (transitionTimer.current) {
        clearTimeout(transitionTimer.current);
        transitionTimer.current = null;
      }
      if (footerDelayTimer.current) {
        clearTimeout(footerDelayTimer.current);
        footerDelayTimer.current = null;
      }
      if (breakpointTransitionTimer.current) {
        clearTimeout(breakpointTransitionTimer.current);
        breakpointTransitionTimer.current = null;
      }

      // Additional cleanup for main content ref with enhanced safety checks
      if (mainContent.current) {
        try {
          mainContent.current.style.pointerEvents = 'auto';
          mainContent.current.style.willChange = 'auto';
          mainContent.current.style.transform = '';
          mainContent.current.style.transition = '';
        } catch (error) {
          // Silently handle cleanup errors to prevent console spam
          console.debug('AppLayout cleanup: Element no longer available');
        }
      }

      // Clear any stored focus reference
      if (previousFocus) {
        previousFocus.current = null;
      }

      // Additional cleanup for any remaining event listeners or observers
      // This ensures complete cleanup even if other useEffect cleanups fail
      try {
        // Force garbage collection of any remaining references
        const elements = document.querySelectorAll(
          '[data-responsive-transition="true"]'
        );
        elements.forEach((element) => {
          if (element instanceof HTMLElement) {
            element.style.transition = '';
            element.style.willChange = 'auto';
          }
        });
      } catch (error) {
        console.debug('AppLayout cleanup: Additional cleanup failed', error);
      }
    };
  }, []);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Header */}
      <Header
        onMenuClick={handleSidebarToggle}
        sidebarOpen={layoutState.sidebarOpen}
        isTransitioning={layoutState.isTransitioning}
      />

      {/* Sidebar for desktop with enhanced transition callbacks */}
      {!isMobile && (
        <Sidebar
          open={layoutState.sidebarOpen}
          width={sidebarWidth}
          onClose={() =>
            setLayoutState((prev) => ({ ...prev, sidebarOpen: false }))
          }
          onTransitionStart={() => {
            // Additional coordination when sidebar transition starts
            if (mainContentRef.current) {
              mainContentRef.current.style.pointerEvents = 'none';
            }
            // Ensure proper transition state coordination
            setLayoutState((prev) => ({
              ...prev,
              isTransitioning: true,
              transitionType: 'sidebar',
            }));
          }}
          onTransitionEnd={() => {
            // Re-enable interactions when sidebar transition completes
            if (mainContentRef.current) {
              mainContentRef.current.style.pointerEvents = 'auto';
            }
            // Clear transition state after sidebar animation completes
            setLayoutState((prev) => ({
              ...prev,
              isTransitioning: false,
              transitionType: null,
            }));
          }}
        />
      )}

      {/* Main content */}
      <AnimationErrorBoundary
        animationType="content-transition"
        componentName="AppLayout"
      >
        <Box
          ref={mainContentRef}
          component="main"
          data-responsive-transition={
            layoutState.isTransitioning &&
            layoutState.transitionType === 'breakpoint'
          }
          sx={{
            flexGrow: 1,
            // Optimized header spacing with minimal gaps using calculated values
            pt: {
              xs: layoutCalculations.paddingTop,
              sm: layoutCalculations.paddingTopDesktop,
            },
            pb: {
              xs: '72px', // Mobile navigation height + comfortable spacing (56px + 16px)
              md: layoutCalculations.paddingBottom,
            },
            // Enhanced content positioning with minimal gaps and centering
            pl: { xs: 1.5, sm: 2 }, // Optimized padding for better space utilization
            pr: { xs: 1.5, sm: 2 },
            // Use transform instead of margin-left for better performance
            transform: layoutCalculations.mainContentTransform,
            width: layoutCalculations.mainContentWidth,
            // Add centering properties
            maxWidth: layoutCalculations.mainContentMaxWidth,
            margin: layoutCalculations.mainContentMargin,
            // Enhanced transition with coordinated timing including centering properties
            ...createOptimizedTransition(
              ['transform', 'width', 'padding-bottom', 'max-width', 'margin'],
              getAnimationDuration(
                getTransitionDuration(
                  layoutState.transitionType,
                  adaptiveAnimationConfig
                )
              ),
              layoutState.isTransitioning
                ? adaptiveAnimationConfig.easing.sharp
                : adaptiveAnimationConfig.easing.enter
            ),
            // Improved minimum height calculation with exact values
            minHeight: {
              xs: `calc(100vh - ${layoutCalculations.headerHeight.xs}px)`,
              sm: `calc(100vh - ${layoutCalculations.headerHeight.sm}px)`,
            },
            // Performance optimizations with coordinated will-change
            willChange: getWillChangeProperties(
              layoutState.transitionType,
              layoutState.isTransitioning
            ),
            // Use GPU acceleration for smoother animations
            backfaceVisibility: 'hidden',
            perspective: 1000,
            // Enhanced responsive behavior with improved breakpoint handling and smooth transitions
            [`@media (max-width: ${theme.breakpoints.values.md - 1}px)`]: {
              transform: 'translateX(0) !important', // Always reset transform on mobile with higher specificity
              width: '100% !important', // Ensure full width on mobile
              pl: 1.5, // Optimized mobile padding
              pr: 1.5,
              pt: layoutCalculations.paddingTop,
              pb: '72px', // Mobile navigation height + comfortable spacing
              // Ensure smooth transition during breakpoint changes
              transition:
                layoutState.isTransitioning &&
                layoutState.transitionType === 'breakpoint'
                  ? createOptimizedTransition(
                      ['padding', 'transform', 'width'],
                      getAnimationDuration(
                        adaptiveAnimationConfig.duration.content * 0.8
                      ),
                      adaptiveAnimationConfig.easing.smooth
                    ).transition
                  : undefined,
              // Additional mobile-specific optimizations
              maxWidth: '100vw', // Prevent horizontal overflow
              overflowX: 'hidden', // Ensure no horizontal scroll
            },
            [`@media (min-width: ${theme.breakpoints.values.md}px)`]: {
              pb: layoutCalculations.paddingBottom,
              pl: 2, // Optimized desktop padding
              pr: 2,
              pt: layoutCalculations.paddingTopDesktop,
              // Enhanced desktop responsive behavior with smooth transitions
              transition:
                layoutState.isTransitioning &&
                layoutState.transitionType === 'breakpoint'
                  ? createOptimizedTransition(
                      [
                        'padding-bottom',
                        'transform',
                        'width',
                        'max-width',
                        'margin',
                      ],
                      getAnimationDuration(
                        adaptiveAnimationConfig.duration.content
                      ),
                      adaptiveAnimationConfig.easing.smooth
                    ).transition
                  : undefined,
              // Desktop-specific optimizations with centering support
              maxWidth: layoutCalculations.mainContentMaxWidth,
              margin: layoutCalculations.mainContentMargin,
              overflowX: 'visible', // Allow desktop overflow if needed
            },
            // Enhanced responsive breakpoint handling for edge cases
            '@media (min-width: 900px) and (max-width: 1199px)': {
              // Tablet-specific optimizations
              pl: 1.8,
              pr: 1.8,
            },
            // Enhanced reduced motion support
            '@media (prefers-reduced-motion: reduce)': {
              transition: 'none !important',
              transform: 'none !important',
              willChange: 'auto !important',
              // Ensure content is still properly positioned without animations
              marginLeft:
                !isMobile && layoutState.sidebarOpen
                  ? `${sidebarWidth}px`
                  : 'auto',
              marginRight: !isMobile && !layoutState.sidebarOpen ? 'auto' : 0,
              maxWidth: layoutCalculations.mainContentMaxWidth,
            },
            // Enhanced content flow and alignment with better edge case handling
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            // Optimize for content rendering and prevent layout shifts
            contain: 'layout style',
            // Ensure content doesn't overflow during transitions
            overflow: 'hidden auto',
            // Better text rendering and content alignment
            textAlign: 'left',
            // Prevent content jumping during transitions
            boxSizing: 'border-box',
          }}
        >
          {children}
        </Box>
      </AnimationErrorBoundary>

      {/* Mobile navigation */}
      {isMobile && <MobileNavigation />}

      {/* Desktop footer navigation - shows when sidebar is closed on desktop */}
      {!isMobile && (
        <DesktopFooterNavigation
          visible={layoutState.showDesktopFooter}
          onNavigate={handleFooterNavigate}
        />
      )}

      {/* Add Todo FAB - shows only on todos page */}
      {shouldShowFAB && (
        <AddTodoFAB
          visible={true}
          onClick={handleAddTodoClick}
          position="footer-integrated"
        />
      )}

      {/* Mobile sidebar overlay with enhanced coordination */}
      {isMobile && (
        <Sidebar
          open={layoutState.sidebarOpen}
          width={sidebarWidth}
          onClose={() =>
            setLayoutState((prev) => ({ ...prev, sidebarOpen: false }))
          }
          variant="temporary"
          onTransitionStart={() => {
            // Coordinate mobile sidebar transitions
            if (mainContentRef.current) {
              mainContentRef.current.style.pointerEvents = 'none';
            }
            // Ensure proper mobile transition state coordination
            setLayoutState((prev) => ({
              ...prev,
              isTransitioning: true,
              transitionType: 'sidebar',
            }));
          }}
          onTransitionEnd={() => {
            // Re-enable interactions after mobile sidebar transition
            if (mainContentRef.current) {
              mainContentRef.current.style.pointerEvents = 'auto';
            }
            // Clear mobile transition state
            setLayoutState((prev) => ({
              ...prev,
              isTransitioning: false,
              transitionType: null,
            }));
          }}
        />
      )}
    </Box>
  );
};
