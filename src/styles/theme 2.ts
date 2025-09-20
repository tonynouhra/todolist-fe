import { createTheme, ThemeOptions, PaletteMode } from '@mui/material/styles';

// Material Design 3 Color Tokens
const materialColors = {
  primary: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3',
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1',
  },
  secondary: {
    50: '#fce4ec',
    100: '#f8bbd9',
    200: '#f48fb1',
    300: '#f06292',
    400: '#ec407a',
    500: '#e91e63',
    600: '#d81b60',
    700: '#c2185b',
    800: '#ad1457',
    900: '#880e4f',
  },
  error: {
    50: '#ffebee',
    100: '#ffcdd2',
    200: '#ef9a9a',
    300: '#e57373',
    400: '#ef5350',
    500: '#f44336',
    600: '#e53935',
    700: '#d32f2f',
    800: '#c62828',
    900: '#b71c1c',
  },
  warning: {
    50: '#fff3e0',
    100: '#ffe0b2',
    200: '#ffcc80',
    300: '#ffb74d',
    400: '#ffa726',
    500: '#ff9800',
    600: '#fb8c00',
    700: '#f57c00',
    800: '#ef6c00',
    900: '#e65100',
  },
  success: {
    50: '#e8f5e8',
    100: '#c8e6c9',
    200: '#a5d6a7',
    300: '#81c784',
    400: '#66bb6a',
    500: '#4caf50',
    600: '#43a047',
    700: '#388e3c',
    800: '#2e7d32',
    900: '#1b5e20',
  },
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
};

// Material Design Motion Tokens
const motionTokens = {
  duration: {
    short1: '50ms',
    short2: '100ms',
    short3: '150ms',
    short4: '200ms',
    medium1: '250ms',
    medium2: '300ms',
    medium3: '350ms',
    medium4: '400ms',
    long1: '450ms',
    long2: '500ms',
    long3: '550ms',
    long4: '600ms',
    extraLong1: '700ms',
    extraLong2: '800ms',
    extraLong3: '900ms',
    extraLong4: '1000ms',
  },
  easing: {
    linear: 'cubic-bezier(0, 0, 1, 1)',
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    standardAccelerate: 'cubic-bezier(0.3, 0, 1, 1)',
    standardDecelerate: 'cubic-bezier(0, 0, 0, 1)',
    emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
    emphasizedAccelerate: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
    emphasizedDecelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  },
};

// Accessibility utility functions
const getReducedMotionStyles = () => ({
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none !important',
    animation: 'none !important',
    transform: 'none !important',
    '&:hover': {
      transform: 'none !important',
    },
    '&:active': {
      transform: 'none !important',
    },
  },
});

const getAccessibleFocusStyles = (color: string = '#1976d2') => ({
  '&:focus-visible': {
    outline: `2px solid ${color}`,
    outlineOffset: '2px',
    borderRadius: '4px',
  },
  // Ensure focus is visible even when outline is customized
  '&:focus:not(:focus-visible)': {
    outline: 'none',
  },
});

const getMinimumTouchTarget = () => ({
  minHeight: '44px',
  minWidth: '44px',
  '@media (max-width: 899px)': {
    minHeight: '48px', // Larger touch targets on mobile
    minWidth: '48px',
  },
});

// Material Design Animation Mixins
const getMaterialTransition = (
  properties: string[] = ['all'],
  duration: string = motionTokens.duration.short4,
  easing: string = motionTokens.easing.standard
) => ({
  transition: properties
    .map((prop) => `${prop} ${duration} ${easing}`)
    .join(', '),
  ...getReducedMotionStyles(),
});

const getMaterialElevation = (level: number) => {
  const elevations = {
    0: 'none',
    1: '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
    2: '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)',
    3: '0px 1px 3px 0px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)',
    4: '0px 2px 3px 0px rgba(0, 0, 0, 0.3), 0px 6px 10px 4px rgba(0, 0, 0, 0.15)',
    5: '0px 4px 4px 0px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)',
  };
  return elevations[level as keyof typeof elevations] || elevations[1];
};

// Create theme function that supports both light and dark modes
const createAppTheme = (mode: PaletteMode): ThemeOptions => ({
  palette: {
    mode,
    primary: {
      ...materialColors.primary,
      main: materialColors.primary[600],
    },
    secondary: {
      ...materialColors.secondary,
      main: materialColors.secondary[600],
    },
    error: {
      ...materialColors.error,
      main: materialColors.error[600],
    },
    warning: {
      ...materialColors.warning,
      main: materialColors.warning[600],
    },
    success: {
      ...materialColors.success,
      main: materialColors.success[600],
    },
    grey: materialColors.grey,
    ...(mode === 'light'
      ? {
          // Light mode palette
          background: {
            default: materialColors.grey[50],
            paper: '#ffffff',
          },
          text: {
            primary: 'rgba(0, 0, 0, 0.87)',
            secondary: 'rgba(0, 0, 0, 0.6)',
          },
          divider: 'rgba(0, 0, 0, 0.12)',
        }
      : {
          // Dark mode palette
          background: {
            default: '#121212',
            paper: '#1e1e1e',
          },
          text: {
            primary: 'rgba(255, 255, 255, 0.87)',
            secondary: 'rgba(255, 255, 255, 0.6)',
          },
          divider: 'rgba(255, 255, 255, 0.12)',
        }),
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    // Material Design 3 Typography Scale
    h1: {
      fontSize: '3.5rem',
      fontWeight: 400,
      lineHeight: 1.167,
      letterSpacing: '-0.01562em',
    },
    h2: {
      fontSize: '2.25rem',
      fontWeight: 400,
      lineHeight: 1.2,
      letterSpacing: '-0.00833em',
    },
    h3: {
      fontSize: '1.875rem',
      fontWeight: 400,
      lineHeight: 1.167,
      letterSpacing: '0em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.235,
      letterSpacing: '0.00735em',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.334,
      letterSpacing: '0em',
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.6,
      letterSpacing: '0.0075em',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.75,
      letterSpacing: '0.00938em',
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.57,
      letterSpacing: '0.00714em',
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0.00938em',
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.43,
      letterSpacing: '0.01071em',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.75,
      letterSpacing: '0.02857em',
      textTransform: 'uppercase' as const,
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.66,
      letterSpacing: '0.03333em',
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 2.66,
      letterSpacing: '0.08333em',
      textTransform: 'uppercase' as const,
    },
  },
  breakpoints: {
    values: {
      xs: 0, // Mobile phones (portrait)
      sm: 600, // Mobile phones (landscape) / Small tablets
      md: 900, // Tablets / Small laptops
      lg: 1200, // Desktop / Large laptops
      xl: 1536, // Large desktop / 4K displays
    },
  },
  spacing: 8, // Material Design 8dp grid system
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20, // Material Design 3 rounded corners
          textTransform: 'none',
          fontWeight: 500,
          ...getAccessibleFocusStyles(),
          ...getMinimumTouchTarget(),
          ...getMaterialTransition([
            'background-color',
            'box-shadow',
            'transform',
          ]),
          // Material Design 3 state layers
          '&:hover': {
            boxShadow: getMaterialElevation(1),
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
            boxShadow: getMaterialElevation(0),
          },
          '&:disabled': {
            opacity: 0.38,
            cursor: 'not-allowed',
          },
        },
        contained: {
          boxShadow: getMaterialElevation(1),
          '&:hover': {
            boxShadow: getMaterialElevation(2),
          },
          '&:active': {
            boxShadow: getMaterialElevation(1),
          },
        },
        outlined: {
          borderWidth: '1px',
          '&:hover': {
            borderWidth: '2px',
          },
        },
        text: {
          '&:hover': {
            backgroundColor:
              mode === 'light'
                ? 'rgba(25, 118, 210, 0.04)'
                : 'rgba(144, 202, 249, 0.08)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          ...getMaterialTransition(['box-shadow', 'background-color']),
          // Material Design 3 surface colors
          backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
          // Enhanced responsive behavior
          '@media (max-width: 599px)': {
            borderRadius: 8,
          },
        },
        elevation1: {
          boxShadow: getMaterialElevation(1),
        },
        elevation2: {
          boxShadow: getMaterialElevation(2),
        },
        elevation3: {
          boxShadow: getMaterialElevation(3),
        },
        elevation4: {
          boxShadow: getMaterialElevation(4),
        },
        elevation5: {
          boxShadow: getMaterialElevation(5),
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        root: {
          '& .MuiDrawer-paper': {
            ...getMaterialTransition(
              ['transform'],
              motionTokens.duration.medium2,
              motionTokens.easing.emphasized
            ),
            backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
            borderRight:
              mode === 'light'
                ? '1px solid rgba(0, 0, 0, 0.12)'
                : '1px solid rgba(255, 255, 255, 0.12)',
          },
          '& .MuiBackdrop-root': {
            ...getMaterialTransition(['opacity'], motionTokens.duration.short4),
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
          // Enhanced responsive behavior
          '@media (max-width: 899px)': {
            '& .MuiDrawer-paper': {
              width: '280px',
              maxWidth: '85vw',
            },
          },
          '@media (min-width: 900px)': {
            '& .MuiDrawer-paper': {
              width: '280px',
            },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          ...getAccessibleFocusStyles(),
          ...getMinimumTouchTarget(),
          ...getMaterialTransition(['background-color', 'transform']),
          '&:hover': {
            backgroundColor:
              mode === 'light'
                ? 'rgba(0, 0, 0, 0.04)'
                : 'rgba(255, 255, 255, 0.08)',
            transform: 'scale(1.05)',
          },
          '&:active': {
            transform: 'scale(0.95)',
            backgroundColor:
              mode === 'light'
                ? 'rgba(0, 0, 0, 0.08)'
                : 'rgba(255, 255, 255, 0.12)',
          },
          '&:disabled': {
            opacity: 0.38,
            cursor: 'not-allowed',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          ...getAccessibleFocusStyles(),
          ...getMinimumTouchTarget(),
          ...getMaterialTransition(['background-color', 'transform']),
          '&:hover': {
            backgroundColor:
              mode === 'light'
                ? 'rgba(25, 118, 210, 0.04)'
                : 'rgba(144, 202, 249, 0.08)',
            transform: 'translateX(4px)',
          },
          '&.Mui-selected': {
            backgroundColor:
              mode === 'light'
                ? 'rgba(25, 118, 210, 0.12)'
                : 'rgba(144, 202, 249, 0.16)',
            '&:hover': {
              backgroundColor:
                mode === 'light'
                  ? 'rgba(25, 118, 210, 0.16)'
                  : 'rgba(144, 202, 249, 0.20)',
            },
          },
          '&:disabled': {
            opacity: 0.38,
            cursor: 'not-allowed',
          },
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          ...getAccessibleFocusStyles(),
          ...getMinimumTouchTarget(),
          ...getMaterialTransition(['color', 'background-color']),
          '&:hover': {
            backgroundColor:
              mode === 'light'
                ? 'rgba(25, 118, 210, 0.04)'
                : 'rgba(144, 202, 249, 0.08)',
          },
          '&.Mui-selected': {
            color: materialColors.primary[600],
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          ...getAccessibleFocusStyles(),
          ...getMinimumTouchTarget(),
          ...getMaterialTransition(['transform', 'box-shadow']),
          boxShadow: getMaterialElevation(3),
          '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: getMaterialElevation(4),
          },
          '&:active': {
            transform: 'scale(0.95)',
            boxShadow: getMaterialElevation(2),
          },
          '&:disabled': {
            opacity: 0.38,
            cursor: 'not-allowed',
            transform: 'none',
          },
        },
        extended: {
          borderRadius: 16,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          ...getMaterialTransition(['box-shadow', 'background-color']),
          boxShadow: getMaterialElevation(2),
          backgroundColor:
            mode === 'light' ? materialColors.primary[600] : '#1e1e1e',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          ...getMinimumTouchTarget(),
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          ...getMaterialTransition(['box-shadow', 'transform']),
          boxShadow: getMaterialElevation(1),
          '&:hover': {
            boxShadow: getMaterialElevation(2),
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            ...getMaterialTransition(['border-color', 'box-shadow']),
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: materialColors.primary[400],
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: '2px',
              borderColor: materialColors.primary[600],
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          ...getMaterialTransition(['background-color', 'transform']),
          '&:hover': {
            transform: 'scale(1.02)',
          },
          '&.MuiChip-clickable:active': {
            transform: 'scale(0.98)',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          ...getMaterialTransition(['transform', 'opacity']),
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          '& .MuiSnackbarContent-root': {
            borderRadius: 8,
            ...getMaterialTransition(['transform']),
          },
        },
      },
    },
  },
});

// Export both light and dark themes
export const lightTheme = createTheme(createAppTheme('light'));
export const darkTheme = createTheme(createAppTheme('dark'));

// Export default theme (light mode)
export const theme = lightTheme;
