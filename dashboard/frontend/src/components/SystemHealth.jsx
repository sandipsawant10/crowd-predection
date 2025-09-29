import React from "react";
<<<<<<< HEAD
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
=======
>>>>>>> ea3d40be97ff3893c60530342170df6ec42e1285

/**
 * Modern system health component with Material-UI cards
 * Features:
 * - Clean card-based layout for each service
 * - Color-coded status indicators
 * - Professional status chips
 * - Responsive grid layout
 */
export default function SystemHealth({ health }) {
<<<<<<< HEAD
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
=======
  const getStatusStyle = (status) => {
    if (status === "running")
      return "bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md ring-2 ring-green-400";
    if (status === "stopped")
      return "bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md ring-2 ring-red-400";
    return "bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-semibold shadow-md ring-2 ring-yellow-300";
  };

  return (
    <div className="bg-gradient-to-r from-slate-800 to-gray-800 rounded-2xl shadow-lg p-6 border border-gray-700">
      <h2 className="text-2xl font-bold mb-5 text-blue-300 flex items-center gap-2">
        ⚙️ System Health
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {health.map((service, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center bg-slate-900 px-4 py-3 rounded-xl border border-gray-700 shadow hover:shadow-blue-500/20 transition"
          >
            <span className="text-lg font-medium text-gray-100">
              {service.name}
            </span>
            <span className={getStatusStyle(service.status)}>
              {service.status}
            </span>
          </div>
        ))}
      </div>
    </div>
>>>>>>> ea3d40be97ff3893c60530342170df6ec42e1285
  );
}
