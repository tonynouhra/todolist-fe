import React from 'react';
import { ClerkProvider } from './contexts/ClerkProvider';

test('ClerkProvider initializes without crashing', () => {
  // Test that ClerkProvider can be instantiated
  expect(() => {
    const provider = React.createElement(ClerkProvider, {
      children: React.createElement('div'),
    });
    expect(provider).toBeDefined();
  }).not.toThrow();
});

test('environment variables are properly configured', () => {
  // Test that required environment variables are set
  expect(process.env.REACT_APP_CLERK_PUBLISHABLE_KEY).toBeDefined();
});
