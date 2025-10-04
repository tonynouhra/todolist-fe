import * as React from 'react';
import {
  Dashboard as DashboardIcon,
  Assignment as TodoIcon,
  Folder as ProjectIcon,
  Psychology as AIIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

// Navigation Item Interface
export interface NavigationItem {
  text: string;
  translationKey: string; // i18n translation key
  icon: React.ReactElement;
  path: string;
  disabled?: boolean;
  showInFooter?: boolean;
}

// Secondary Navigation Item Interface (for settings, etc.)
export interface SecondaryNavigationItem extends NavigationItem {
  showInFooter: false; // Secondary items should not appear in footer
}

// Main Navigation Items
export const navigationItems: NavigationItem[] = [
  {
    text: 'Dashboard', // Fallback text
    translationKey: 'nav.dashboard',
    icon: React.createElement(DashboardIcon),
    path: '/dashboard',
    showInFooter: true,
  },
  {
    text: 'Todos',
    translationKey: 'nav.todos',
    icon: React.createElement(TodoIcon),
    path: '/todos',
    showInFooter: true,
  },
  {
    text: 'Projects',
    translationKey: 'nav.projects',
    icon: React.createElement(ProjectIcon),
    path: '/projects',
    showInFooter: true,
  },
  {
    text: 'AI Assistant',
    translationKey: 'nav.aiAssistant',
    icon: React.createElement(AIIcon),
    path: '/ai',
    disabled: true, // Will be enabled when AI features are implemented
    showInFooter: false, // Don't show disabled items in footer
  },
  {
    text: 'Settings',
    translationKey: 'nav.settings',
    icon: React.createElement(SettingsIcon),
    path: '/settings',
    showInFooter: true, // Show Settings in both sidebar and footer navigation
  },
];

// Secondary Navigation Items (kept for future use)
export const secondaryNavigationItems: SecondaryNavigationItem[] = [];

// Get navigation items that should appear in footer
export const getFooterNavigationItems = (): NavigationItem[] => {
  return navigationItems.filter((item) => item.showInFooter && !item.disabled);
};

// Get all navigation items (for sidebar)
export const getAllNavigationItems = (): NavigationItem[] => {
  return navigationItems;
};

// Get secondary navigation items (for sidebar)
export const getSecondaryNavigationItems = (): SecondaryNavigationItem[] => {
  return secondaryNavigationItems;
};

// Check if a navigation item is active based on current path
export const isNavigationItemActive = (
  item: NavigationItem,
  currentPath: string
): boolean => {
  return currentPath === item.path;
};

// Get active navigation item from current path
export const getActiveNavigationItem = (
  currentPath: string
): NavigationItem | undefined => {
  return navigationItems.find((item) => item.path === currentPath);
};
