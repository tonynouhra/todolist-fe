import React, { forwardRef } from 'react';
import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { useAnnouncer } from '../../utils/accessibility';

interface AccessibleButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  successMessage?: string;
  errorMessage?: string;
  announceOnClick?: boolean;
  ariaDescribedBy?: string;
  tooltipText?: string;
}

export const AccessibleButton = forwardRef<
  HTMLButtonElement,
  AccessibleButtonProps
>(
  (
    {
      loading = false,
      loadingText = 'Loading...',
      successMessage,
      errorMessage,
      announceOnClick = false,
      ariaDescribedBy,
      tooltipText,
      children,
      onClick,
      disabled,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const announce = useAnnouncer();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (announceOnClick && typeof children === 'string') {
        announce(`${children} button activated`, 'polite');
      }

      onClick?.(event);
    };

    const isDisabled = disabled || loading;
    const buttonText = loading ? loadingText : children;
    const buttonAriaLabel =
      ariaLabel || (typeof children === 'string' ? children : undefined);

    return (
      <Button
        ref={ref}
        {...props}
        disabled={isDisabled}
        onClick={handleClick}
        aria-label={buttonAriaLabel}
        aria-describedby={ariaDescribedBy}
        aria-busy={loading}
        title={tooltipText}
        sx={{
          position: 'relative',
          ...props.sx,
        }}
      >
        {loading && (
          <CircularProgress
            size={20}
            sx={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              marginLeft: '-10px',
              marginTop: '-10px',
            }}
            aria-label="Loading"
          />
        )}
        <span
          style={{
            opacity: loading ? 0 : 1,
            transition: 'opacity 0.2s ease-in-out',
          }}
        >
          {buttonText}
        </span>

        {/* Screen reader only text for loading state */}
        {loading && (
          <span
            style={{
              position: 'absolute',
              left: '-10000px',
              width: '1px',
              height: '1px',
              overflow: 'hidden',
            }}
            aria-live="polite"
          >
            {loadingText}
          </span>
        )}
      </Button>
    );
  }
);
