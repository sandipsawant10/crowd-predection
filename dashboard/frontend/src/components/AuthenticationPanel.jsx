import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import Login from "./Login";

/**
 * Authentication panel that handles loading, login, and authenticated states
 * Uses Material-UI components for consistent styling
 */
const AuthenticationPanel = ({
  isAuthenticated,
  isLoading,
  userProfile,
  onLoginSuccess,
  onLogout,
}) => {
  return (
    <>
      {isLoading ? (
        // Loading state with Material-UI spinner
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: 200,
            gap: 2,
          }}
        >
          <CircularProgress size={48} />
          <Typography variant="body2" color="text.secondary">
            Checking authentication...
          </Typography>
        </Box>
      ) : !isAuthenticated ? (
        // Not authenticated - show login
        <Login onLoginSuccess={onLoginSuccess} />
      ) : null}
      {/* Note: Authenticated state is now handled by DashboardLayout */}
    </>
  );
};

export default AuthenticationPanel;
