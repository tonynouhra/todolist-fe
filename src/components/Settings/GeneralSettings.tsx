/**
 * General Settings Component
 *
 * Manages general preferences like language and timezone.
 */

import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Alert,
  Grid,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import type { UserSettings } from '../../types/settings';
import { SUPPORTED_LANGUAGES, COMMON_TIMEZONES } from '../../types/settings';

interface GeneralSettingsProps {
  settings: UserSettings;
}

export default function GeneralSettings({
  settings: _settingsProp,
}: GeneralSettingsProps) {
  const { t, i18n } = useTranslation();
  const { settings, updateLanguage, updateTimezone, isUpdating, updateError } =
    useSettings();
  const [localError, setLocalError] = React.useState<Error | null>(null);
  const [success, setSuccess] = React.useState(false);

  const handleLanguageChange = async (event: any) => {
    try {
      setLocalError(null);
      setSuccess(false);
      const newLanguage = event.target.value;
      await updateLanguage(newLanguage);
      // Change i18n language
      await i18n.changeLanguage(newLanguage);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setLocalError(error as Error);
    }
  };

  const handleTimezoneChange = async (event: any) => {
    try {
      setLocalError(null);
      setSuccess(false);
      await updateTimezone(event.target.value);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setLocalError(error as Error);
    }
  };

  // Use settings from hook, fallback to prop
  const currentSettings = settings || _settingsProp;

  if (!currentSettings) {
    return null;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('settings.general.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        {t('settings.general.description')}
      </Typography>

      {(localError || updateError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('settings.messages.updateError')}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {t('settings.messages.updateSuccess')}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="language-select-label">
                {t('settings.general.language')}
              </InputLabel>
              <Select
                labelId="language-select-label"
                id="language-select"
                value={currentSettings.language}
                label={t('settings.general.language')}
                onChange={handleLanguageChange}
                disabled={isUpdating}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography
              variant="caption"
              display="block"
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              {t('settings.general.languageDescription')}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="timezone-select-label">
                {t('settings.general.timezone')}
              </InputLabel>
              <Select
                labelId="timezone-select-label"
                id="timezone-select"
                value={currentSettings.timezone}
                label={t('settings.general.timezone')}
                onChange={handleTimezoneChange}
                disabled={isUpdating}
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <MenuItem key={tz.value} value={tz.value}>
                    {tz.label} (UTC{tz.offset})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography
              variant="caption"
              display="block"
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              {t('settings.general.timezoneDescription')}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
