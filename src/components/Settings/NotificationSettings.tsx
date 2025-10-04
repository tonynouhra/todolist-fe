/**
 * Notification Settings Component
 *
 * Manages notification preferences.
 */

import React from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Paper,
  Alert,
  Divider,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import type { UserSettings } from '../../types/settings';

interface NotificationSettingsProps {
  settings: UserSettings;
}

export default function NotificationSettings({
  settings: _settingsProp,
}: NotificationSettingsProps) {
  const { t } = useTranslation();
  const { settings, updateNotifications, isUpdating, updateError } =
    useSettings();
  const [localError, setLocalError] = React.useState<Error | null>(null);
  const [success, setSuccess] = React.useState(false);

  const handleToggle =
    (field: keyof UserSettings) =>
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      try {
        setLocalError(null);
        setSuccess(false);
        await updateNotifications({
          [field]: event.target.checked,
        });
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
        {t('settings.notifications.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        {t('settings.notifications.description')}
      </Typography>

      {(localError || updateError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('settings.messages.notificationUpdateError')}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {t('settings.messages.notificationUpdateSuccess')}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={currentSettings.notifications_enabled}
              onChange={handleToggle('notifications_enabled')}
              disabled={isUpdating}
            />
          }
          label={t('settings.notifications.enableNotifications')}
        />
        <Typography
          variant="caption"
          display="block"
          color="text.secondary"
          sx={{ ml: 4, mb: 2 }}
        >
          {t('settings.notifications.enableNotificationsDescription')}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ opacity: currentSettings.notifications_enabled ? 1 : 0.5 }}>
          <FormControlLabel
            control={
              <Switch
                checked={currentSettings.email_notifications}
                onChange={handleToggle('email_notifications')}
                disabled={!currentSettings.notifications_enabled || isUpdating}
              />
            }
            label={t('settings.notifications.emailNotifications')}
          />
          <Typography
            variant="caption"
            display="block"
            color="text.secondary"
            sx={{ ml: 4, mb: 2 }}
          >
            {t('settings.notifications.emailNotificationsDescription')}
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={currentSettings.push_notifications}
                onChange={handleToggle('push_notifications')}
                disabled={!currentSettings.notifications_enabled || isUpdating}
              />
            }
            label={t('settings.notifications.pushNotifications')}
          />
          <Typography
            variant="caption"
            display="block"
            color="text.secondary"
            sx={{ ml: 4 }}
          >
            {t('settings.notifications.pushNotificationsDescription')}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
