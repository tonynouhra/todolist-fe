import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';
import { lightTheme, darkTheme } from '../styles/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: PaletteMode;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize theme mode (light/dark/system) from localStorage or default to system
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const savedTheme = localStorage.getItem('theme-mode') as ThemeMode;
    return savedTheme || 'system';
  });

  // Get the actual palette mode based on theme mode and system preference
  const getActualMode = (theme: ThemeMode): PaletteMode => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return theme as PaletteMode;
  };

  const [mode, setMode] = useState<PaletteMode>(() => getActualMode(themeMode));

  // Listen for system theme changes when in system mode
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if in system mode
      if (themeMode === 'system') {
        setMode(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  // Save theme preference to localStorage and update actual mode
  useEffect(() => {
    localStorage.setItem('theme-mode', themeMode);
    setMode(getActualMode(themeMode));
  }, [themeMode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    setThemeModeState((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const setThemeMode = (newMode: ThemeMode) => {
    setThemeModeState(newMode);
  };

  const theme = mode === 'light' ? lightTheme : darkTheme;

  const contextValue: ThemeContextType = {
    mode,
    themeMode,
    toggleTheme,
    setThemeMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeProvider;
