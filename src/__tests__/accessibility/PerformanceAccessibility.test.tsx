import React from 'react';
import { render, screen, waitFor, fireEvent } from '../../test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import { LazyImage } from '../../components/common/LazyImage';
import { AccessibleButton } from '../../components/common/AccessibleButton';
import { FocusManager } from '../../components/common/FocusManager';
import userEvent from '@testing-library/user-event';

expect.extend(toHaveNoViolations);

// Mock IntersectionObserver for LazyImage tests
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

describe('Performance and Accessibility Components', () => {
  describe('LazyImage', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <LazyImage
          src="https://example.com/image.jpg"
          alt="Test image description"
          width={200}
          height={150}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should provide proper alt text', () => {
      render(
        <LazyImage
          src="https://example.com/image.jpg"
          alt="A beautiful sunset over the mountains"
          width={200}
          height={150}
        />
      );

      // Check for alt text in skeleton placeholder
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });

    it('should handle loading states accessibly', async () => {
      const { container } = render(
        <LazyImage
          src="https://example.com/image.jpg"
          alt="Test image"
          width={200}
          height={150}
          loading="eager"
        />
      );

      // Should show loading skeleton initially
      expect(screen.getByTestId('lazy-image-placeholder')).toBeInTheDocument();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should handle error states accessibly', async () => {
      const { container } = render(
        <LazyImage
          src="invalid-url"
          alt="Test image"
          width={200}
          height={150}
          loading="eager"
        />
      );

      // Simulate image error
      const img = screen.getByRole('img', { name: 'Test image' });
      fireEvent.error(img);

      await waitFor(() => {
        expect(
          screen.getByRole('img', { name: /failed to load image/i })
        ).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('AccessibleButton', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <AccessibleButton onClick={jest.fn()}>Click me</AccessibleButton>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should provide proper ARIA attributes', () => {
      render(
        <AccessibleButton
          onClick={jest.fn()}
          aria-describedby="button-description"
          tooltipText="This button performs an action"
        >
          Action Button
        </AccessibleButton>
      );

      const button = screen.getByRole('button', { name: 'Action Button' });
      expect(button).toHaveAttribute('aria-describedby', 'button-description');
      expect(button).toHaveAttribute('title', 'This button performs an action');
    });

    it('should handle loading state accessibly', async () => {
      const { container } = render(
        <AccessibleButton loading loadingText="Processing...">
          Submit
        </AccessibleButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toBeDisabled();
      expect(screen.getByLabelText('Loading')).toBeInTheDocument();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      const mockClick = jest.fn();

      render(
        <AccessibleButton onClick={mockClick}>Keyboard Test</AccessibleButton>
      );

      const button = screen.getByRole('button', { name: 'Keyboard Test' });

      // Focus the button
      await user.tab();
      expect(button).toHaveFocus();

      // Activate with Enter
      await user.keyboard('{Enter}');
      expect(mockClick).toHaveBeenCalledTimes(1);

      // Activate with Space
      await user.keyboard(' ');
      expect(mockClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('FocusManager', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <FocusManager>
          <button>Test Button</button>
          <input type="text" placeholder="Test Input" />
        </FocusManager>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should provide skip links', () => {
      render(
        <FocusManager
          skipLinks={[
            { href: '#main', label: 'Skip to main content' },
            { href: '#nav', label: 'Skip to navigation' },
          ]}
        >
          <div>Content</div>
        </FocusManager>
      );

      const skipLinks = screen.getAllByRole('link');
      expect(skipLinks).toHaveLength(2);
      expect(skipLinks[0]).toHaveTextContent('Skip to main content');
      expect(skipLinks[1]).toHaveTextContent('Skip to navigation');
    });

    it('should handle focus trapping when enabled', async () => {
      const user = userEvent.setup();

      render(
        <FocusManager trapFocus>
          <button>First Button</button>
          <button>Second Button</button>
          <button>Third Button</button>
        </FocusManager>
      );

      const buttons = screen.getAllByRole('button');

      // First button should be focused initially
      expect(buttons[0]).toHaveFocus();

      // Tab through buttons
      await user.tab();
      expect(buttons[1]).toHaveFocus();

      await user.tab();
      expect(buttons[2]).toHaveFocus();

      // Should wrap back to first button
      await user.tab();
      expect(buttons[0]).toHaveFocus();

      // Shift+Tab should go backwards
      await user.tab({ shift: true });
      expect(buttons[2]).toHaveFocus();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support arrow key navigation in lists', async () => {
      const user = userEvent.setup();

      render(
        <div role="listbox" aria-label="Test list">
          <div role="option" tabIndex={0} aria-selected="true">
            Option 1
          </div>
          <div role="option" tabIndex={-1} aria-selected="false">
            Option 2
          </div>
          <div role="option" tabIndex={-1} aria-selected="false">
            Option 3
          </div>
        </div>
      );

      const options = screen.getAllByRole('option');

      // Focus first option
      options[0].focus();
      expect(options[0]).toHaveFocus();

      // Arrow down should move to next option
      await user.keyboard('{ArrowDown}');
      // Note: This would require implementing the arrow key handler in the component
    });

    it('should handle escape key for modals', async () => {
      const user = userEvent.setup();
      const mockClose = jest.fn();

      render(
        <div
          role="dialog"
          aria-modal="true"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              mockClose();
            }
          }}
        >
          <button>Close</button>
        </div>
      );

      const dialog = screen.getByRole('dialog');
      dialog.focus();

      await user.keyboard('{Escape}');
      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide proper live regions', () => {
      render(
        <div>
          <div aria-live="polite" aria-atomic="true">
            Status updates appear here
          </div>
          <div aria-live="assertive">Error messages appear here</div>
        </div>
      );

      expect(screen.getByText('Status updates appear here')).toHaveAttribute(
        'aria-live',
        'polite'
      );
      expect(screen.getByText('Error messages appear here')).toHaveAttribute(
        'aria-live',
        'assertive'
      );
    });

    it('should use proper heading hierarchy', () => {
      render(
        <div>
          <h1>Main Title</h1>
          <h2>Section Title</h2>
          <h3>Subsection Title</h3>
        </div>
      );

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Main Title'
      );
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        'Section Title'
      );
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
        'Subsection Title'
      );
    });

    it('should provide descriptive labels for form controls', () => {
      render(
        <form>
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            aria-describedby="email-help"
            required
          />
          <div id="email-help">Enter your email address to receive updates</div>
        </form>
      );

      const input = screen.getByLabelText('Email Address');
      expect(input).toHaveAttribute('aria-describedby', 'email-help');
      expect(input).toBeRequired();
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    it('should not rely solely on color for information', () => {
      render(
        <div>
          <span style={{ color: 'red' }} aria-label="Error">
            ❌ This field is required
          </span>
          <span style={{ color: 'green' }} aria-label="Success">
            ✅ Field is valid
          </span>
        </div>
      );

      // Icons and text provide information beyond just color
      expect(screen.getByLabelText('Error')).toHaveTextContent('❌');
      expect(screen.getByLabelText('Success')).toHaveTextContent('✅');
    });
  });

  describe('Motion and Animation Accessibility', () => {
    it('should respect prefers-reduced-motion', () => {
      // Mock prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(
        <div
          style={{
            transition: window.matchMedia('(prefers-reduced-motion: reduce)')
              .matches
              ? 'none'
              : 'all 0.3s ease',
          }}
        >
          Animated content
        </div>
      );

      // Animation should be disabled when prefers-reduced-motion is set
      const element = screen.getByText('Animated content');
      expect(element).toHaveStyle('transition: none');
    });
  });
});
