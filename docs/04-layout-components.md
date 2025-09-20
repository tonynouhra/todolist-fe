# Layout Components Documentation

## Overview

This document describes the core layout components implemented for the TodoList frontend application. The layout system provides a responsive, Material Design-compliant interface that adapts seamlessly between desktop and mobile devices.

## Architecture

The layout system consists of four main components:

1. **AppLayout** - Main layout wrapper that orchestrates all layout components
2. **Header** - Top navigation bar with app branding and user controls
3. **Sidebar** - Collapsible navigation sidebar for desktop
4. **MobileNavigation** - Bottom navigation bar for mobile devices

### Component Hierarchy

```
AppLayout
├── Header
├── Sidebar (desktop)
├── Main Content Area
└── MobileNavigation (mobile)
    └── Sidebar (mobile overlay)
```

## Components

### AppLayout

**Location**: `src/components/layout/AppLayout.tsx`

The main layout wrapper that provides the overall structure and responsive behavior.

**Features**:
- Responsive breakpoint detection using MUI's `useMediaQuery`
- Automatic sidebar state management based on screen size
- Smooth transitions between desktop and mobile layouts
- Proper spacing calculations for header and navigation

**Props**:
```typescript
interface AppLayoutProps {
  children: React.ReactNode;
}
```

**Key Responsive Behaviors**:
- Desktop (≥900px): Shows permanent sidebar, no bottom navigation
- Mobile (<900px): Shows bottom navigation, temporary sidebar overlay

### Header

**Location**: `src/components/layout/Header.tsx`

Top navigation bar with app branding, menu toggle, and user controls.

**Features**:
- Responsive width adjustment based on sidebar state
- Material Design AppBar styling
- Integrated Clerk UserButton for authentication
- Menu toggle button with visual state indicators

**Props**:
```typescript
interface HeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
  sidebarWidth: number;
}
```

**Visual Elements**:
- App title: "TodoList" with bold typography
- Menu button: Toggles between Menu and MenuOpen icons
- User button: Clerk-provided user avatar and menu

### Sidebar

**Location**: `src/components/layout/Sidebar.tsx`

Collapsible navigation sidebar with primary and secondary navigation sections.

**Features**:
- Two variants: permanent (desktop) and temporary (mobile)
- Visual indication of active routes
- Disabled state for future features
- Material Design navigation styling
- Smooth transitions and hover effects

**Props**:
```typescript
interface SidebarProps {
  open: boolean;
  width: number;
  onClose: () => void;
  variant?: 'permanent' | 'temporary';
}
```

**Navigation Structure**:

*Primary Navigation*:
- Dashboard (active)
- Todos (disabled - future task)
- Projects (disabled - future task)
- AI Assistant (disabled - future task)

*Secondary Navigation*:
- Settings (disabled - future task)

**Visual States**:
- **Selected**: Primary color background with white text
- **Disabled**: 50% opacity with no interaction
- **Hover**: Subtle background color change

### MobileNavigation

**Location**: `src/components/layout/MobileNavigation.tsx`

Bottom navigation bar optimized for mobile touch interactions.

**Features**:
- Fixed positioning at bottom of screen
- Material Design BottomNavigation component
- Touch-friendly target sizes
- Visual feedback for active states

**Navigation Items**:
- Dashboard, Todos, Projects, AI (same as sidebar)
- Compact labels and icons
- Disabled states for future features

## Responsive Design Patterns

### Breakpoint Strategy

The layout uses MUI's default breakpoints:
- **xs**: 0px (mobile portrait)
- **sm**: 600px (mobile landscape)
- **md**: 900px (tablet) - **Primary breakpoint for layout switching**
- **lg**: 1200px (desktop)
- **xl**: 1536px (large desktop)

### Layout Transitions

**Desktop to Mobile**:
1. Sidebar collapses and becomes overlay
2. Header adjusts to full width
3. Bottom navigation appears
4. Main content padding adjusts

**Mobile to Desktop**:
1. Bottom navigation disappears
2. Sidebar becomes permanent
3. Header width adjusts for sidebar
4. Main content margin adjusts

### Spacing System

- **Header Height**: 64px (standard MUI AppBar)
- **Sidebar Width**: 280px (optimal for navigation items)
- **Mobile Navigation Height**: 64px
- **Content Padding**: Responsive based on layout state

## Material Design Implementation

### Color Scheme

- **Primary**: Used for active navigation states
- **Surface**: Background colors for navigation elements
- **On-Surface**: Text and icon colors
- **Divider**: Subtle borders and separators

### Typography

- **Header Title**: h6 variant with 600 font weight
- **Navigation Items**: 0.875rem with weight variation for states
- **Icons**: 24px standard size with proper color inheritance

### Animations

- **Sidebar Transitions**: Sharp easing with 225ms duration
- **Navigation Hover**: Subtle background color transitions
- **Layout Shifts**: Smooth margin and width transitions

## Accessibility Features

### Keyboard Navigation

- All navigation items are keyboard accessible
- Proper tab order maintained
- Focus indicators visible
- Skip links consideration for future enhancement

### Screen Reader Support

- Semantic navigation structure
- Proper ARIA labels on interactive elements
- Descriptive button labels (e.g., "toggle navigation")
- List structure for navigation items

### Touch Accessibility

- Minimum 44px touch targets on mobile
- Adequate spacing between interactive elements
- Touch-friendly hover states

## Integration Points

### Router Integration

- Uses React Router's `useLocation` for active state detection
- `useNavigate` for programmatic navigation
- Automatic route highlighting

### Authentication Integration

- Clerk UserButton in header
- Protected route awareness
- User context integration

### Theme Integration

- Full MUI theme system integration
- Responsive breakpoint usage
- Color palette adherence
- Typography scale compliance

## Future Enhancements

### Planned Features (Disabled Currently)

1. **Todos Page** - Will be enabled in task 5
2. **Projects Page** - Will be enabled in task 6
3. **AI Assistant Page** - Will be enabled in task 7
4. **Settings Page** - Future enhancement

### Potential Improvements

1. **Breadcrumb Navigation** - For deep page hierarchies
2. **Search Integration** - Global search in header
3. **Notifications** - Badge indicators on navigation items
4. **Customization** - User preferences for sidebar behavior
5. **Keyboard Shortcuts** - Quick navigation hotkeys

## Testing Considerations

### Responsive Testing

- Test all breakpoints (xs, sm, md, lg, xl)
- Verify smooth transitions between layouts
- Check touch interactions on mobile devices
- Validate sidebar behavior on different screen sizes

### Accessibility Testing

- Screen reader compatibility
- Keyboard-only navigation
- Color contrast compliance
- Focus management

### Integration Testing

- Route navigation functionality
- Authentication state handling
- Theme switching (when implemented)
- Error boundary integration

## Performance Considerations

### Optimization Strategies

- Efficient re-rendering with proper dependency arrays
- Minimal state updates for responsive behavior
- Optimized Material-UI component usage
- Proper memoization where beneficial

### Bundle Impact

- Layout components add minimal bundle size
- Material-UI components are tree-shaken
- Icons imported individually to reduce bundle
- No heavy dependencies introduced

## Maintenance Guidelines

### Code Organization

- Each component in separate file
- Clear prop interfaces
- Consistent naming conventions
- Proper TypeScript typing

### Style Consistency

- Use MUI theme system exclusively
- Avoid custom CSS where possible
- Maintain consistent spacing patterns
- Follow Material Design guidelines

### Future Development

- Keep navigation items configurable
- Maintain responsive design patterns
- Consider accessibility in all changes
- Document any breaking changes