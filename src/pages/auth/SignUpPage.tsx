import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import { Box, Container, Typography } from '@mui/material';

export const SignUpPage: React.FC = () => {
  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={3}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Join TodoList
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          Create your account to start managing your todos efficiently
        </Typography>
        <SignUp
          routing="path"
          path="/sign-up"
          redirectUrl="/dashboard"
          signInUrl="/sign-in"
        />
      </Box>
    </Container>
  );
};
