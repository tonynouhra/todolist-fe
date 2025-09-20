import React, { useEffect, useRef } from 'react';
import { useFocusTrap, useAnnouncer } from '../../utils/accessibility';

interface FocusManagerProps {
  children: React.ReactNode;
  trapFocus?: boolean;
  restoreFocus?: boolean;
  announceOnMount?: string;
  announceOnUnmount?: string;
  skipLinks?: Array<{ href: string; label: string }>;
}

export const FocusManager: React.FC<FocusManagerProps> = ({
  children,
  trapFocus = false,
  restoreFocus = true,
  announceOnMount,
  announceOnUnmount,
  skipLinks = [],
}) => {
  const containerRef = useFocusTrap(trapFocus);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const announce = useAnnouncer();

  useEffect(() => {
    // Save current focus if restore is enabled
    if (restoreFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }

    // Announce mount message
    if (announceOnMount) {
      announce(announceOnMount, 'polite');
    }

    return () => {
      // Announce unmount message
      if (announceOnUnmount) {
        announce(announceOnUnmount, 'polite');
      }

      // Restore focus
      if (restoreFocus && previousFocusRef.current) {
        setTimeout(() => {
          previousFocusRef.current?.focus();
        }, 0);
      }
    };
  }, [announce, announceOnMount, announceOnUnmount, restoreFocus]);

  return (
    <div ref={containerRef as React.RefObject<HTMLDivElement>}>
      {/* Skip links */}
      {skipLinks.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="skip-link"
          style={{
            position: 'absolute',
            left: '-10000px',
            top: 'auto',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            zIndex: 9999,
            padding: '8px 16px',
            backgroundColor: '#000',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '4px',
          }}
          onFocus={(e) => {
            const target = e.target as HTMLElement;
            target.style.position = 'fixed';
            target.style.top = '10px';
            target.style.left = '10px';
            target.style.width = 'auto';
            target.style.height = 'auto';
            target.style.overflow = 'visible';
          }}
          onBlur={(e) => {
            const target = e.target as HTMLElement;
            target.style.position = 'absolute';
            target.style.left = '-10000px';
            target.style.width = '1px';
            target.style.height = '1px';
            target.style.overflow = 'hidden';
          }}
        >
          {link.label}
        </a>
      ))}
      {children}
    </div>
  );
};
