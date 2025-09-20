import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { Box, Container, Typography } from '@mui/material';

export const SignInPage: React.FC = () => {
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
          Welcome to TodoList
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          Sign in to access your personal todo management dashboard
        </Typography>
        <SignIn
          routing="path"
          path="/sign-in"
          redirectUrl="/dashboard"
          signUpUrl="/sign-up"
        />
      </Box>
    </Container>
  );
};
