import React from 'react';
import { ClerkProvider as BaseClerkProvider } from '@clerk/clerk-react';

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error('Missing Clerk Publishable Key');
}

interface ClerkProviderProps {
  children: React.ReactNode;
}

export const ClerkProvider: React.FC<ClerkProviderProps> = ({ children }) => {
  return (
    <BaseClerkProvider publishableKey={clerkPubKey}>
      {children}
    </BaseClerkProvider>
  );
};
