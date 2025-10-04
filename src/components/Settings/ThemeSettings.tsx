/**
 * Theme Settings Component
 *
 * Manages theme/appearance preferences.
 */

import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import type { UserSettings, ThemeType } from '../../types/settings';

interface ThemeSettingsProps {
  settings: UserSettings;
}

export default function ThemeSettings({
  settings: _settingsProp,
}: ThemeSettingsProps) {
  const { t } = useTranslation();
  const { settings, updateTheme, isUpdating } = useSettings();
  const { setThemeMode } = useAppTheme();
  const { showSuccess, showError } = useNotification();

  const handleThemeChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newTheme = event.target.value as ThemeType;
    try {
      // Update theme in UI immediately
      setThemeMode(newTheme);

      // Save to backend
      await updateTheme(newTheme);
      showSuccess(t('settings.messages.updateSuccess'));
    } catch (error) {
      showError(t('settings.messages.updateError'));
      // Revert theme on error
      if (currentSettings?.theme) {
        setThemeMode(currentSettings.theme);
      }
    }
  };

  // Use settings from hook, fallback to prop
  const currentSettings = settings || _settingsProp;

  // Sync theme from settings when they load
  React.useEffect(() => {
    if (currentSettings?.theme) {
      setThemeMode(currentSettings.theme);
    }
  }, [currentSettings?.theme, setThemeMode]);

  if (!currentSettings) {
    return null;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('settings.appearance.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        {t('settings.appearance.description')}
      </Typography>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <FormControl component="fieldset">
          <FormLabel component="legend">
            {t('settings.appearance.theme')}
          </FormLabel>
          <RadioGroup
            aria-label="theme"
            name="theme"
            value={currentSettings.theme}
            onChange={handleThemeChange}
          >
            <FormControlLabel
              value="light"
              control={<Radio />}
              label={t('settings.appearance.light')}
              disabled={isUpdating}
            />
            <FormControlLabel
              value="dark"
              control={<Radio />}
              label={t('settings.appearance.dark')}
              disabled={isUpdating}
            />
            <FormControlLabel
              value="system"
              control={<Radio />}
              label={t('settings.appearance.system')}
              disabled={isUpdating}
            />
          </RadioGroup>
        </FormControl>

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {t('settings.appearance.themeDescription')}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
