// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfills for Node.js environment
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock environment variables for tests
process.env.REACT_APP_CLERK_PUBLISHABLE_KEY = 'pk_test_mock_key_for_testing';
process.env.REACT_APP_API_URL = 'http://localhost:8000';

// Mock IntersectionObserver for components that use it
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver for components that use it
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo for components that use it
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// Mock animation configuration for tests
jest.mock('./constants/animations', () => {
  const originalModule = jest.requireActual('./constants/animations');

  const mockAnimationConfig = {
    duration: {
      sidebar: 280,
      footer: 180,
      content: 240,
      iconTransition: 120,
    },
    easing: {
      enter: 'cubic-bezier(0.2, 0, 0.2, 1)',
      exit: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
    delays: {
      footerShow: 80,
      footerHide: 0,
    },
  };

  return {
    ...originalModule,
    getAdaptiveAnimationConfig: jest.fn(() => mockAnimationConfig),
    adaptiveAnimationConfig: mockAnimationConfig,
    shouldReduceMotion: jest.fn(() => false),
    getAnimationDuration: jest.fn((duration) => duration),
    getDevicePerformanceLevel: jest.fn(() => 'medium'),
  };
});

// Setup MSW server for API mocking (conditionally)
let server: any;

beforeAll(async () => {
  // Only setup MSW if we're running integration tests
  if (process.env.NODE_ENV === 'test' && !process.env.SKIP_MSW) {
    try {
      const { server: mswServer } = await import('./test-utils/mocks/server');
      server = mswServer;
      server.listen({
        onUnhandledRequest: 'warn',
      });
    } catch (error) {
      console.warn('MSW server setup failed:', error);
    }
  }
});

afterEach(() => {
  if (server) {
    server.resetHandlers();
  }
});

afterAll(() => {
  if (server) {
    server.close();
  }
});

// Suppress console errors during tests unless explicitly needed
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
        args[0].includes('Warning: Useless constructor') ||
        args[0].includes('Warning: Unexpected empty method'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
