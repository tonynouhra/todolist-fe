import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, AlertColor, Slide, SlideProps } from '@mui/material';

export interface Notification {
  id: string;
  message: string;
  severity: AlertColor;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (
    message: string,
    severity?: AlertColor,
    duration?: number
  ) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  hideNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const hideNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  }, []);

  const showNotification = useCallback(
    (
      message: string,
      severity: AlertColor = 'info',
      duration: number = 6000
    ) => {
      const id = Date.now().toString();
      const notification: Notification = {
        id,
        message,
        severity,
        duration,
      };

      setNotifications((prev) => [...prev, notification]);

      // Auto-hide notification after duration
      if (duration > 0) {
        setTimeout(() => {
          hideNotification(id);
        }, duration);
      }
    },
    [hideNotification]
  );

  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      showNotification(message, 'success', duration);
    },
    [showNotification]
  );

  const showError = useCallback(
    (message: string, duration?: number) => {
      showNotification(message, 'error', duration || 8000); // Errors stay longer
    },
    [showNotification]
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => {
      showNotification(message, 'warning', duration);
    },
    [showNotification]
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => {
      showNotification(message, 'info', duration);
    },
    [showNotification]
  );

  const value: NotificationContextType = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideNotification,
  };

  // Slide transition component
  const SlideTransition = (props: SlideProps) => {
    return <Slide {...props} direction="left" />;
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={notification.duration}
          onClose={() => hideNotification(notification.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          TransitionComponent={SlideTransition}
          sx={{
            mt: 8 + index * 7, // Stack notifications below header with proper spacing
            '@media (max-width: 600px)': {
              mt: 7 + index * 6,
              left: '50%',
              right: 'auto',
              transform: 'translateX(-50%)',
            },
          }}
        >
          <Alert
            onClose={() => hideNotification(notification.id)}
            severity={notification.severity}
            variant="filled"
            elevation={8}
            sx={{
              width: '100%',
              minWidth: '300px',
              maxWidth: '500px',
              borderRadius: '12px',
              boxShadow: (theme) =>
                theme.palette.mode === 'dark'
                  ? '0 8px 16px 0 rgba(0,0,0,0.4), 0 12px 40px 0 rgba(0,0,0,0.3)'
                  : '0 8px 16px 0 rgba(0,0,0,0.14), 0 12px 40px 0 rgba(0,0,0,0.12)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: (theme) =>
                  theme.palette.mode === 'dark'
                    ? '0 12px 20px 0 rgba(0,0,0,0.5), 0 16px 48px 0 rgba(0,0,0,0.4)'
                    : '0 12px 20px 0 rgba(0,0,0,0.18), 0 16px 48px 0 rgba(0,0,0,0.16)',
              },
              '& .MuiAlert-icon': {
                fontSize: '22px',
                alignItems: 'center',
                padding: '7px 0',
              },
              '& .MuiAlert-message': {
                fontSize: '0.9375rem',
                fontWeight: 500,
                lineHeight: 1.5,
                padding: '8px 0',
              },
              '& .MuiAlert-action': {
                alignItems: 'center',
                paddingTop: '6px',
                paddingLeft: '8px',
                '& .MuiIconButton-root': {
                  padding: '6px',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  },
                },
              },
              '@media (max-width: 600px)': {
                minWidth: '280px',
                maxWidth: '90vw',
                borderRadius: '8px',
              },
            }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </NotificationContext.Provider>
  );
};
