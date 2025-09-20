# Authentication Setup with Clerk

This document describes the authentication implementation using Clerk for the TodoList frontend application.

## Overview

The authentication system is built using Clerk, providing secure user authentication with the following features:

- User sign-in and sign-up
- Protected routes that require authentication
- Automatic redirects for authenticated/unauthenticated users
- Session management and token handling
- User profile management

## Components Implemented

### 1. ClerkProvider (`src/contexts/ClerkProvider.tsx`)
- Wraps the entire application with Clerk authentication context
- Configures Clerk with the publishable key from environment variables
- Provides authentication state to all child components

### 2. ProtectedRoute (`src/components/auth/ProtectedRoute.tsx`)
- Higher-order component that protects routes requiring authentication
- Shows loading spinner while Clerk initializes
- Redirects unauthenticated users to sign-in page
- Preserves the intended destination for post-login redirect

### 3. Authentication Pages
- **SignInPage** (`src/pages/auth/SignInPage.tsx`): Clerk-powered sign-in interface
- **SignUpPage** (`src/pages/auth/SignUpPage.tsx`): User registration interface
- **DashboardPage** (`src/pages/dashboard/DashboardPage.tsx`): Protected dashboard with user profile

### 4. Router Configuration (`src/router/AppRouter.tsx`)
- Handles routing between public and protected pages
- Implements authentication-based redirects
- Prevents authenticated users from accessing auth pages
- Provides fallback routes for unknown paths

## Authentication Flow

1. **Initial Load**: Clerk initializes and checks for existing session
2. **Unauthenticated**: User is redirected to sign-in page
3. **Sign-in/Sign-up**: User authenticates through Clerk components
4. **Success**: User is redirected to dashboard or intended destination
5. **Protected Routes**: ProtectedRoute component guards access to authenticated areas
6. **Sign-out**: UserButton provides sign-out functionality with redirect to sign-in

## Environment Configuration

Required environment variables in `.env.local`:

```bash
REACT_APP_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
```

## Security Features

- JWT token-based authentication
- Automatic token refresh
- Secure session management
- HTTPS enforcement in production
- XSS and CSRF protection through Clerk's security measures

## Testing

The authentication system includes basic tests for:
- ClerkProvider initialization
- Environment variable configuration
- Component exports and structure

## Next Steps

The authentication foundation is now ready for:
- Integration with API calls (adding auth headers)
- User profile management
- Role-based access control (if needed)
- Additional authentication providers (if required)

## Usage Examples

### Protecting a Route
```tsx
<Route
  path="/protected-page"
  element={
    <ProtectedRoute>
      <YourProtectedComponent />
    </ProtectedRoute>
  }
/>
```

### Accessing User Information
```tsx
import { useUser } from '@clerk/clerk-react';

const MyComponent = () => {
  const { user } = useUser();
  return <div>Welcome, {user?.firstName}!</div>;
};
```

### Sign Out
```tsx
import { UserButton } from '@clerk/clerk-react';

const Header = () => {
  return (
    <div>
      <UserButton afterSignOutUrl="/sign-in" />
    </div>
  );
};
```