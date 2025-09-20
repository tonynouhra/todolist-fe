import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import { AppLayout } from '../../components/layout';

export const AIPage: React.FC = () => {
  return (
    <AppLayout>
      <Container maxWidth="lg">
        <Box py={4}>
          <Box mb={4}>
            <Typography variant="h4" component="h1">
              AI Assistant
            </Typography>
          </Box>

          <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              AI Features Coming Soon
            </Typography>
            <Typography variant="body1" color="text.secondary">
              This page will be implemented in task 7.
            </Typography>
          </Paper>
        </Box>
      </Container>
    </AppLayout>
  );
};
