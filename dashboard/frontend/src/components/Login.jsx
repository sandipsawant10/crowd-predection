import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  useTheme,
} from "@mui/material";
import {
  Login as LoginIcon,
  PersonAdd as RegisterIcon,
  Security as SecurityIcon,
} from "@mui/icons-material";
import { authAPI } from "../utils/api";

/**
 * Modern login component with Material-UI design
 * Features:
 * - Clean card-based layout
 * - Form validation with proper error display
 * - Toggle between login and registration
 * - Professional styling with icons and animations
 */
export default function Login({ onLoginSuccess }) {
  const theme = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let result;

      if (isLogin) {
        // Login
        result = await authAPI.login({
          email: formData.email,
          password: formData.password,
        });
      } else {
        // Register
        result = await authAPI.register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });

        // If registration is successful, automatically log in
        if (result.success) {
          result = await authAPI.login({
            email: formData.email,
            password: formData.password,
          });
        }
      }

      if (result.token) {
        // Get user profile
        const profile = await authAPI.getProfile();
        console.log("Logged in successfully:", profile);

        // Notify parent component
        if (onLoginSuccess) {
          onLoginSuccess(profile);
        }
      } else {
        // Check for validation errors
        if (result.errors && result.errors.length > 0) {
          // Format validation errors nicely
          const errorMessages = result.errors
            .map((err) => `${err.field}: ${err.message}`)
            .join(", ");
          setError(`Validation errors: ${errorMessages}`);
        } else {
          setError(result.message || "Authentication failed");
        }
      }
    } catch (err) {
      console.error("Auth error:", err);

      // Check if error has validation details
      if (err.validationErrors) {
        const errorMessages = err.validationErrors
          .map((error) => `${error.field}: ${error.message}`)
          .join(", ");
        setError(`Validation errors: ${errorMessages}`);
      } else if (err.data && err.data.errors) {
        // Alternative format
        const errorMessages = err.data.errors
          .map((error) => `${error.field}: ${error.message}`)
          .join(", ");
        setError(`Validation errors: ${errorMessages}`);
      } else {
        setError(err.message || "Authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError("");
    // Clear form when switching modes
    setFormData({
      username: "",
      email: "",
      password: "",
    });
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`,
        p: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 420,
          width: "100%",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: theme.palette.primary.main,
                mb: 2,
              }}
            >
              <SecurityIcon sx={{ color: "white", fontSize: 32 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              {isLogin ? "Welcome Back" : "Create Account"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isLogin
                ? "Sign in to access your dashboard"
                : "Join the Smart Crowd Management System"}
            </Typography>
          </Box>

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit}>
            {!isLogin && (
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required={!isLogin}
                sx={{ mb: 3 }}
                variant="outlined"
              />
            )}

            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              sx={{ mb: 3 }}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              sx={{ mb: 4 }}
              variant="outlined"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={
                loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : isLogin ? (
                  <LoginIcon />
                ) : (
                  <RegisterIcon />
                )
              }
              sx={{
                py: 1.5,
                mb: 3,
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 600,
              }}
            >
              {loading
                ? "Processing..."
                : isLogin
                ? "Sign In"
                : "Create Account"}
            </Button>

            <Divider sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>

            <Button
              fullWidth
              variant="text"
              onClick={toggleAuthMode}
              sx={{
                textTransform: "none",
                color: theme.palette.primary.main,
                fontWeight: 500,
              }}
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
