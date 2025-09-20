# Design Document

## Overview

This design document outlines the improvements to the menu UI system for the TodoList application. The solution focuses on creating a more centralized, smooth, and accessible navigation experience across different screen sizes. The design introduces a desktop footer navigation when the sidebar is closed, improves animation transitions, and enhances visual feedback throughout the interface.

## Architecture

### Component Structure

The menu UI improvements will involve modifications to existing layout components and the introduction of a new footer navigation component:

```
AppLayout (Modified)
├── Header (Enhanced)
├── Sidebar (Enhanced)
├── DesktopFooterNavigation (New)
├── MobileNavigation (Unchanged)
└── Main Content Area (Enhanced transitions)
```

### State Management

The layout state will be enhanced to support the new footer navigation:

```typescript
interface LayoutState {
  sidebarOpen: boolean;
  isTransitioning: boolean;
  showDesktopFooter: boolean;
  isMobile: boolean;
}
```

## Components and Interfaces

### Enhanced AppLayout Component

**Purpose:** Orchestrate the layout state and determine which navigation components to display

**Key Changes:**
- Add transition state management
- Control desktop footer visibility
- Improve responsive behavior

**Props Interface:**
```typescript
interface AppLayoutProps {
  children: React.ReactNode;
}

interface LayoutState {
  sidebarOpen: boolean;
  isTransitioning: boolean;
  showDesktopFooter: boolean;
}
```

### Enhanced Header Component

**Purpose:** Provide improved menu toggle functionality with better visual feedback

**Key Changes:**
- Add transition state handling
- Improve button hover states
- Disable interactions during transitions

**Props Interface:**
```typescript
interface HeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
  sidebarWidth: number;
  isTransitioning: boolean; // New prop
}
```

### Enhanced Sidebar Component

**Purpose:** Provide smoother animations and better state management

**Key Changes:**
- Improve animation timing and easing
- Better integration with layout transitions
- Enhanced visual states

**Props Interface:**
```typescript
interface SidebarProps {
  open: boolean;
  width: number;
  onClose: () => void;
  onTransitionStart?: () => void; // New prop
  onTransitionEnd?: () => void; // New prop
  variant?: 'permanent' | 'temporary';
}
```

### New DesktopFooterNavigation Component

**Purpose:** Provide navigation access when sidebar is closed on desktop

**Features:**
- Horizontal navigation bar at bottom of screen
- Same navigation items as sidebar
- Active state highlighting
- Smooth show/hide animations
- Fixed positioning to remain visible during scrolling
- Integrated "Add Todo" floating action button

**Props Interface:**
```typescript
interface DesktopFooterNavigationProps {
  visible: boolean;
  currentPath: string;
  onNavigate: (path: string) => void;
  onAddTodo?: () => void; // New prop for Add Todo functionality
}

interface FooterNavigationItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  disabled?: boolean;
}
```

### Enhanced AddTodo Integration

**Purpose:** Provide easy access to todo creation when footer navigation is visible

**Features:**
- Floating action button positioned near footer navigation
- Smooth animations when showing/hiding
- Consistent with existing add todo functionality

**Props Interface:**
```typescript
interface AddTodoFABProps {
  visible: boolean;
  onClick: () => void;
  position: 'bottom-right' | 'footer-integrated';
}
```

## Data Models

### Navigation Items

Shared navigation configuration across all navigation components:

```typescript
interface NavigationItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  disabled?: boolean;
  showInFooter?: boolean; // New property to control footer visibility
}

const navigationItems: NavigationItem[] = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
    showInFooter: true,
  },
  {
    text: 'Todos',
    icon: <TodoIcon />,
    path: '/todos',
    showInFooter: true,
  },
  {
    text: 'Projects',
    icon: <ProjectIcon />,
    path: '/projects',
    showInFooter: true,
  },
  {
    text: 'AI Assistant',
    icon: <AIIcon />,
    path: '/ai',
    disabled: true,
    showInFooter: false, // Don't show disabled items in footer
  },
];
```

### Layout Positioning

Fixed positioning configuration for navigation elements:

```typescript
interface LayoutPositioning {
  sidebar: {
    position: 'fixed';
    top: number;
    left: number;
    height: string;
    zIndex: number;
  };
  footerNavigation: {
    position: 'fixed';
    bottom: number;
    left: number;
    right: number;
    zIndex: number;
  };
  addTodoFAB: {
    position: 'fixed';
    bottom: number;
    right: number;
    zIndex: number;
  };
  mainContent: {
    marginLeft: number; // Dynamic based on sidebar state
    marginBottom: number; // Dynamic based on footer visibility
    paddingLeft: number;
    paddingRight: number;
  };
}
```

### Animation Configuration

Centralized animation settings for consistent transitions:

```typescript
interface AnimationConfig {
  duration: {
    sidebar: number;
    footer: number;
    content: number;
    addTodoFAB: number;
  };
  easing: {
    enter: string;
    exit: string;
  };
  delays: {
    footerShow: number;
    footerHide: number;
    addTodoShow: number;
    addTodoHide: number;
  };
}

const animationConfig: AnimationConfig = {
  duration: {
    sidebar: 300,
    footer: 200,
    content: 300,
    addTodoFAB: 150,
  },
  easing: {
    enter: 'cubic-bezier(0.4, 0, 0.2, 1)',
    exit: 'cubic-bezier(0.4, 0, 0.6, 1)',
  },
  delays: {
    footerShow: 100, // Delay showing footer until sidebar is closed
    footerHide: 0,   // Hide footer immediately when opening sidebar
    addTodoShow: 150, // Show Add Todo FAB after footer is visible
    addTodoHide: 0,   // Hide Add Todo FAB immediately with footer
  },
};
```

### Spacing and Layout Configuration

Consistent spacing values for proper alignment:

```typescript
interface SpacingConfig {
  sidebar: {
    width: number;
    padding: number;
  };
  footer: {
    height: number;
    padding: number;
  };
  mainContent: {
    paddingLeft: number;
    paddingRight: number;
    paddingBottom: number; // When footer is visible
    marginLeft: number; // When sidebar is open
  };
  addTodoFAB: {
    size: number;
    bottomOffset: number; // Distance from footer
    rightOffset: number;
  };
}

const spacingConfig: SpacingConfig = {
  sidebar: {
    width: 240,
    padding: 16,
  },
  footer: {
    height: 64,
    padding: 12,
  },
  mainContent: {
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 80, // Footer height + extra space
    marginLeft: 0, // Will be set to sidebar width when open
  },
  addTodoFAB: {
    size: 56,
    bottomOffset: 80, // Above footer navigation
    rightOffset: 24,
  },
};
```

## Error Handling

### Transition State Management

- Prevent multiple simultaneous transitions
- Handle interrupted transitions gracefully
- Provide fallback states for animation failures

### Responsive Breakpoint Handling

- Smooth transitions between mobile and desktop layouts
- Handle edge cases during screen size changes
- Maintain navigation state across breakpoint changes

### Accessibility Considerations

- Respect user's reduced motion preferences
- Maintain keyboard navigation during transitions
- Ensure screen readers can track navigation state changes

## Testing Strategy

### Unit Tests

1. **Component Rendering Tests**
   - Test each component renders correctly in different states
   - Verify prop handling and default values
   - Test responsive behavior at different breakpoints

2. **State Management Tests**
   - Test sidebar open/close state transitions
   - Verify footer visibility logic
   - Test transition state management

3. **Animation Tests**
   - Test animation timing and completion
   - Verify transition callbacks are called
   - Test reduced motion preference handling

### Integration Tests

1. **Layout Integration Tests**
   - Test complete layout behavior across screen sizes
   - Verify navigation between different pages
   - Test state persistence during navigation

2. **User Interaction Tests**
   - Test menu toggle functionality
   - Verify footer navigation interactions
   - Test keyboard navigation support

### Visual Regression Tests

1. **Animation Smoothness**
   - Capture key frames of transitions
   - Verify consistent animation behavior
   - Test performance under different conditions

2. **Responsive Design**
   - Test layout at various screen sizes
   - Verify proper component visibility
   - Test orientation changes on mobile devices

### Accessibility Tests

1. **Screen Reader Compatibility**
   - Test navigation announcements
   - Verify proper ARIA labels and roles
   - Test focus management during transitions

2. **Keyboard Navigation**
   - Test tab order and focus indicators
   - Verify keyboard shortcuts work correctly
   - Test escape key behavior for closing menus

3. **Motion Preferences**
   - Test reduced motion settings
   - Verify animations can be disabled
   - Test alternative transition methods