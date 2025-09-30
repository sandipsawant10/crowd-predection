import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme/theme";
import Dashboard from "./pages/Dashboard";

/**
 * Main App component with Material-UI theme provider
 * Features:
 * - Global theme configuration for consistent styling
 * - CssBaseline for normalized CSS across browsers
 * - Router setup for future multi-page functionality
 */
export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/" element={<Dashboard />} />
          {/* Add more routes here for future pages */}
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
