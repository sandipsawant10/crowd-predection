import React from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  useTheme,
} from "@mui/material";
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Help as UnknownIcon,
  Memory as ServiceIcon,
} from "@mui/icons-material";

/**
 * Modern system health component with Material-UI cards
 * Features:
 * - Clean card-based layout for each service
 * - Color-coded status indicators
 * - Professional status chips
 * - Responsive grid layout
 */
export default function SystemHealth({ health }) {
  const theme = useTheme();

  const getStatusConfig = (status) => {
    switch (status) {
      case "running":
        return {
          color: theme.palette.success.main,
          icon: <CheckIcon />,
          label: "Running",
          chipColor: "success",
        };
      case "stopped":
        return {
          color: theme.palette.error.main,
          icon: <ErrorIcon />,
          label: "Stopped",
          chipColor: "error",
        };
      default:
        return {
          color: theme.palette.grey[500],
          icon: <UnknownIcon />,
          label: "Unknown",
          chipColor: "default",
        };
    }
  };

  return (
    <Box>
      <Grid container spacing={2}>
        {health.map((service, idx) => {
          const statusConfig = getStatusConfig(service.status);

          return (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Card
                sx={{
                  height: "100%",
                  transition: "transform 0.2s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: statusConfig.color,
                        mr: 2,
                        width: 40,
                        height: 40,
                      }}
                    >
                      <ServiceIcon />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, mb: 0.5 }}
                      >
                        {service.name}
                      </Typography>
                      <Chip
                        icon={statusConfig.icon}
                        label={statusConfig.label}
                        color={statusConfig.chipColor}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
