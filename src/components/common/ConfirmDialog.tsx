import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  alpha,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  severity?: 'warning' | 'error' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  severity = 'warning',
}) => {
  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const getColor = () => {
    switch (severity) {
      case 'error':
        return 'error.main';
      case 'warning':
        return 'warning.main';
      case 'info':
        return 'info.main';
      default:
        return 'warning.main';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.95)
              : theme.palette.background.paper,
          backgroundImage: 'none',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0,0,0,0.6)'
              : '0 8px 32px rgba(0,0,0,0.12)',
        },
      }}
      sx={{
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          pt: 3,
          px: 3,
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <WarningIcon
            sx={{
              color: getColor(),
              fontSize: '28px',
            }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: '1.125rem',
            }}
          >
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          px: 3,
          pb: 2,
        }}
      >
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            fontSize: '0.9375rem',
            lineHeight: 1.6,
          }}
        >
          {message}
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          p: 3,
          pt: 2,
          gap: 1.5,
        }}
      >
        <Button
          onClick={handleClose}
          disabled={isLoading}
          sx={{
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.9375rem',
            px: 3,
            py: 1,
            borderRadius: '8px',
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: (theme) =>
                alpha(theme.palette.text.primary, 0.08),
            },
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isLoading}
          variant="contained"
          color={severity === 'error' ? 'error' : 'primary'}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.9375rem',
            px: 3,
            py: 1,
            borderRadius: '8px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: (theme) =>
                severity === 'error'
                  ? `0 4px 12px ${alpha(theme.palette.error.main, 0.4)}`
                  : `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
            },
          }}
        >
          {isLoading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
