import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Chip,
  Collapse,
  Paper,
  Grid,
  CircularProgress,
  useTheme,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
} from "@mui/icons-material";
import { diagnostic } from "../utils/api";

/**
 * Modern connection status component with Material-UI styling
 * Features:
 * - Clean status indicators with chips
 * - Collapsible details section
 * - Refresh functionality
 * - Responsive grid layout
 */
export default function ConnectionStatus() {
  const theme = useTheme();
  const [health, setHealth] = useState({ checking: true });
  const [auth, setAuth] = useState({ checking: true });
  const [cors, setCors] = useState({ checking: true });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const checkConnections = async () => {
      // Check backend health
      setHealth({ checking: true });
      const healthResult = await diagnostic.checkHealth();
      setHealth(healthResult);

      // Check auth status
      setAuth({ checking: true });
      const authResult = await diagnostic.checkAuth();
      setAuth(authResult);

      // Check CORS configuration
      setCors({ checking: true });
      const corsResult = await diagnostic.checkCORS();
      setCors(corsResult);
    };

    checkConnections();
  }, []);

  const getStatusChipProps = (status, statusType) => {
    if (status.checking) {
      return {
        label: "Checking...",
        color: "default",
        icon: <CircularProgress size={16} />,
      };
    }

    // For auth, a 401 status means the endpoint is working but user is not logged in
    if (statusType === "auth" && status.status === 401) {
      return {
        label: "Login Required",
        color: "warning",
      };
    }

    if (status.connected || status.authenticated || status.corsEnabled) {
      return {
        label:
          statusType === "health"
            ? "Connected"
            : statusType === "auth"
            ? "Authenticated"
            : "Enabled",
        color: "success",
      };
    }

    return {
      label:
        statusType === "health"
          ? "Disconnected"
          : statusType === "auth"
          ? "Connection Error"
          : "Disabled",
      color: "error",
    };
  };

  const runManualCheck = () => {
    setHealth({ checking: true });
    setAuth({ checking: true });
    setCors({ checking: true });

    setTimeout(async () => {
      const healthResult = await diagnostic.checkHealth();
      setHealth(healthResult);

      const authResult = await diagnostic.checkAuth();
      setAuth(authResult);

      const corsResult = await diagnostic.checkCORS();
      setCors(corsResult);
    }, 100);
  };

  return (
    <Box
      sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        Connection Status:
      </Typography>

      <Chip
        {...getStatusChipProps(health, "health")}
        label={`Backend: ${getStatusChipProps(health, "health").label}`}
        size="small"
        variant="outlined"
      />

      <Chip
        {...getStatusChipProps(auth, "auth")}
        label={`Auth: ${getStatusChipProps(auth, "auth").label}`}
        size="small"
        variant="outlined"
      />

      <Chip
        {...getStatusChipProps(cors, "cors")}
        label={`CORS: ${getStatusChipProps(cors, "cors").label}`}
        size="small"
        variant="outlined"
      />

      <Button
        onClick={runManualCheck}
        size="small"
        startIcon={<RefreshIcon />}
        variant="outlined"
        sx={{ ml: 1 }}
      >
        Refresh
      </Button>

      <Button
        onClick={() => setShowDetails(!showDetails)}
        size="small"
        endIcon={showDetails ? <CollapseIcon /> : <ExpandIcon />}
        variant="text"
      >
        Details
      </Button>

      <Collapse in={showDetails} sx={{ width: "100%", mt: 2 }}>
        <Paper sx={{ p: 2, backgroundColor: theme.palette.grey[50] }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Health Check:
              </Typography>
              <Paper
                sx={{
                  p: 1,
                  backgroundColor: theme.palette.grey[900],
                  color: theme.palette.success.main,
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                  maxHeight: 200,
                  overflow: "auto",
                }}
              >
                <pre>{JSON.stringify(health, null, 2)}</pre>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Auth Status:
              </Typography>
              <Paper
                sx={{
                  p: 1,
                  backgroundColor: theme.palette.grey[900],
                  color: theme.palette.success.main,
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                  maxHeight: 200,
                  overflow: "auto",
                }}
              >
                <pre>{JSON.stringify(auth, null, 2)}</pre>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                CORS Configuration:
              </Typography>
              <Paper
                sx={{
                  p: 1,
                  backgroundColor: theme.palette.grey[900],
                  color: theme.palette.success.main,
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                  maxHeight: 200,
                  overflow: "auto",
                }}
              >
                <pre>{JSON.stringify(cors, null, 2)}</pre>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>
    </Box>
  );
}
