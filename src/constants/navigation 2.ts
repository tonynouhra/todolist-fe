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
    text: 'Dashboard',
    icon: React.createElement(DashboardIcon),
    path: '/dashboard',
    showInFooter: true,
  },
  {
    text: 'Todos',
    icon: React.createElement(TodoIcon),
    path: '/todos',
    showInFooter: true,
  },
  {
    text: 'Projects',
    icon: React.createElement(ProjectIcon),
    path: '/projects',
    showInFooter: true,
  },
  {
    text: 'AI Assistant',
    icon: React.createElement(AIIcon),
    path: '/ai',
    disabled: true, // Will be enabled when AI features are implemented
    showInFooter: false, // Don't show disabled items in footer
  },
];

// Secondary Navigation Items
export const secondaryNavigationItems: SecondaryNavigationItem[] = [
  {
    text: 'Settings',
    icon: React.createElement(SettingsIcon),
    path: '/settings',
    disabled: true, // Will be enabled in future tasks
    showInFooter: false,
  },
];

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
