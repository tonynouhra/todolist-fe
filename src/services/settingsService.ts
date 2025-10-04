/**
 * Settings Service
 *
 * API client functions for user settings and preferences management.
 */

import apiClient from './apiClient';
import type { UserSettings, UserSettingsUpdate } from '../types/settings';

const BASE_URL = '/api/settings';

/**
 * Get current user's settings
 */
export const getSettings = async (): Promise<UserSettings> => {
  const response = await apiClient.get<UserSettings>(BASE_URL);
  return response.data;
};

/**
 * Update current user's settings
 */
export const updateSettings = async (
  settings: UserSettingsUpdate
): Promise<UserSettings> => {
  const response = await apiClient.put<UserSettings>(BASE_URL, settings);
  return response.data;
};

/**
 * Reset settings to defaults
 */
export const resetSettings = async (): Promise<UserSettings> => {
  const response = await apiClient.post<UserSettings>(`${BASE_URL}/reset`);
  return response.data;
};

/**
 * Update only theme setting
 */
export const updateTheme = async (
  theme: 'light' | 'dark' | 'system'
): Promise<UserSettings> => {
  return updateSettings({ theme });
};

/**
 * Update only language setting
 */
export const updateLanguage = async (
  language: string
): Promise<UserSettings> => {
  return updateSettings({ language });
};

/**
 * Update only timezone setting
 */
export const updateTimezone = async (
  timezone: string
): Promise<UserSettings> => {
  return updateSettings({ timezone });
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (notifications: {
  notifications_enabled?: boolean;
  email_notifications?: boolean;
  push_notifications?: boolean;
}): Promise<UserSettings> => {
  return updateSettings(notifications);
};

// Export default settings service
const settingsService = {
  getSettings,
  updateSettings,
  resetSettings,
  updateTheme,
  updateLanguage,
  updateTimezone,
  updateNotificationPreferences,
};

export default settingsService;
