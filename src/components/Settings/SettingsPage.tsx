/**
 * Settings Page
 *
 * Main settings page component that displays all user preferences and settings.
 */

import React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Button,
  Divider,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../layout';
import { useSettings } from '../../hooks/useSettings';
import { ConfirmDialog } from '../common/ConfirmDialog';
import ThemeSettings from './ThemeSettings';
import NotificationSettings from './NotificationSettings';
import GeneralSettings from './GeneralSettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = React.useState(0);
  const [showResetDialog, setShowResetDialog] = React.useState(false);

  // Use settings hook with authentication
  const {
    settings,
    isLoading,
    error,
    resetSettings: handleResetSettings,
    isResetting,
    resetError,
  } = useSettings();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const onResetSettings = () => {
    setShowResetDialog(true);
  };

  const handleConfirmReset = async () => {
    await handleResetSettings();
    setShowResetDialog(false);
  };

  const handleCancelReset = () => {
    setShowResetDialog(false);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Alert severity="error">
            Failed to load settings. Please try again later.
          </Alert>
        </Container>
      </AppLayout>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <AppLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box
          sx={{
            mb: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h4" component="h1">
            {t('settings.title')}
          </Typography>
          <Button
            variant="outlined"
            color="secondary"
            onClick={onResetSettings}
            disabled={isResetting}
          >
            {isResetting
              ? t('settings.resetting')
              : t('settings.resetToDefaults')}
          </Button>
        </Box>

        <ConfirmDialog
          open={showResetDialog}
          onClose={handleCancelReset}
          onConfirm={handleConfirmReset}
          title={t('dialogs.resetSettings.title')}
          message={t('dialogs.resetSettings.message')}
          confirmText={t('dialogs.resetSettings.confirm')}
          cancelText={t('dialogs.resetSettings.cancel')}
          isLoading={isResetting}
          severity="warning"
        />

        {resetError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {t('settings.messages.resetError')}
          </Alert>
        )}

        <Paper>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="settings tabs"
              sx={{
                '& .MuiTab-root': {
                  fontSize: '1rem',
                  fontWeight: 500,
                  minHeight: 48,
                  textTransform: 'none',
                },
              }}
            >
              <Tab label={t('settings.general.title')} {...a11yProps(0)} />
              <Tab label={t('settings.appearance.title')} {...a11yProps(1)} />
              <Tab
                label={t('settings.notifications.title')}
                {...a11yProps(2)}
              />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <GeneralSettings settings={settings} />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <ThemeSettings settings={settings} />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <NotificationSettings settings={settings} />
          </TabPanel>
        </Paper>

        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              💡 {t('settings.allChangesSaved')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('settings.lastUpdated')}:{' '}
              {new Date(settings.updated_at).toLocaleString()}
            </Typography>
          </Box>
        </Box>
      </Container>
    </AppLayout>
  );
}
