/**
 * Settings Types
 *
 * TypeScript types and interfaces for user settings and preferences.
 */

export type ThemeType = 'light' | 'dark' | 'system';

export interface UserSettings {
  id: string;
  user_id: string;
  theme: ThemeType;
  language: string;
  timezone: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSettingsUpdate {
  theme?: ThemeType;
  language?: string;
  timezone?: string;
  notifications_enabled?: boolean;
  email_notifications?: boolean;
  push_notifications?: boolean;
}

export interface SettingsFormData {
  theme: ThemeType;
  language: string;
  timezone: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
}

// Language options
export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
];

// Common timezone options
export interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
}

export const COMMON_TIMEZONES: TimezoneOption[] = [
  // UTC
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: '+00:00' },

  // Americas
  {
    value: 'America/New_York',
    label: 'Eastern Time (US & Canada)',
    offset: '-05:00',
  },
  {
    value: 'America/Chicago',
    label: 'Central Time (US & Canada)',
    offset: '-06:00',
  },
  {
    value: 'America/Denver',
    label: 'Mountain Time (US & Canada)',
    offset: '-07:00',
  },
  {
    value: 'America/Los_Angeles',
    label: 'Pacific Time (US & Canada)',
    offset: '-08:00',
  },

  // Europe
  { value: 'Europe/London', label: 'London', offset: '+00:00' },
  { value: 'Europe/Paris', label: 'Paris', offset: '+01:00' },
  { value: 'Europe/Berlin', label: 'Berlin', offset: '+01:00' },
  { value: 'Europe/Rome', label: 'Rome', offset: '+01:00' },
  { value: 'Europe/Istanbul', label: 'Istanbul', offset: '+03:00' },
  { value: 'Europe/Moscow', label: 'Moscow', offset: '+03:00' },

  // Middle East (MENA)
  { value: 'Asia/Riyadh', label: 'Riyadh (Saudi Arabia)', offset: '+03:00' },
  { value: 'Asia/Kuwait', label: 'Kuwait', offset: '+03:00' },
  { value: 'Asia/Bahrain', label: 'Bahrain', offset: '+03:00' },
  { value: 'Asia/Qatar', label: 'Doha (Qatar)', offset: '+03:00' },
  { value: 'Asia/Dubai', label: 'Dubai (UAE)', offset: '+04:00' },
  { value: 'Asia/Muscat', label: 'Muscat (Oman)', offset: '+04:00' },
  { value: 'Asia/Beirut', label: 'Beirut (Lebanon)', offset: '+02:00' },
  { value: 'Asia/Damascus', label: 'Damascus (Syria)', offset: '+03:00' },
  { value: 'Asia/Amman', label: 'Amman (Jordan)', offset: '+03:00' },
  { value: 'Asia/Jerusalem', label: 'Jerusalem', offset: '+02:00' },
  { value: 'Asia/Baghdad', label: 'Baghdad (Iraq)', offset: '+03:00' },
  { value: 'Asia/Tehran', label: 'Tehran (Iran)', offset: '+03:30' },

  // North Africa (MENA)
  { value: 'Africa/Cairo', label: 'Cairo (Egypt)', offset: '+02:00' },
  { value: 'Africa/Tripoli', label: 'Tripoli (Libya)', offset: '+02:00' },
  { value: 'Africa/Tunis', label: 'Tunis (Tunisia)', offset: '+01:00' },
  { value: 'Africa/Algiers', label: 'Algiers (Algeria)', offset: '+01:00' },
  {
    value: 'Africa/Casablanca',
    label: 'Casablanca (Morocco)',
    offset: '+01:00',
  },

  // Sub-Saharan Africa
  { value: 'Africa/Lagos', label: 'Lagos (Nigeria)', offset: '+01:00' },
  { value: 'Africa/Nairobi', label: 'Nairobi (Kenya)', offset: '+03:00' },
  {
    value: 'Africa/Johannesburg',
    label: 'Johannesburg (South Africa)',
    offset: '+02:00',
  },
  {
    value: 'Africa/Addis_Ababa',
    label: 'Addis Ababa (Ethiopia)',
    offset: '+03:00',
  },
  { value: 'Africa/Accra', label: 'Accra (Ghana)', offset: '+00:00' },
  { value: 'Africa/Khartoum', label: 'Khartoum (Sudan)', offset: '+02:00' },
  {
    value: 'Africa/Dar_es_Salaam',
    label: 'Dar es Salaam (Tanzania)',
    offset: '+03:00',
  },
  { value: 'Africa/Kampala', label: 'Kampala (Uganda)', offset: '+03:00' },
  { value: 'Africa/Kinshasa', label: 'Kinshasa (DR Congo)', offset: '+01:00' },
  { value: 'Africa/Dakar', label: 'Dakar (Senegal)', offset: '+00:00' },
  { value: 'Africa/Abidjan', label: 'Abidjan (Ivory Coast)', offset: '+00:00' },

  // Asia
  { value: 'Asia/Kolkata', label: 'India Standard Time', offset: '+05:30' },
  { value: 'Asia/Shanghai', label: 'China Standard Time', offset: '+08:00' },
  { value: 'Asia/Tokyo', label: 'Tokyo', offset: '+09:00' },
  { value: 'Asia/Singapore', label: 'Singapore', offset: '+08:00' },

  // Australia & Pacific
  { value: 'Australia/Sydney', label: 'Sydney', offset: '+11:00' },
  { value: 'Pacific/Auckland', label: 'Auckland', offset: '+13:00' },
];
