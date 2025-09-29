import React from "react";
import { Box, Typography, Chip, Tooltip, Paper, useTheme } from "@mui/material";
import { FiberManualRecord as DotIcon } from "@mui/icons-material";

/**
 * Modern location map view with Material-UI styling
 * Features:
 * - Clean map visualization with camera positions
 * - Color-coded crowd level indicators
 * - Tooltips for camera information
 * - Legend with proper Material Design chips
 */
const LocationMapView = ({ cameraLocations, locationCrowdLevels }) => {
  const theme = useTheme();

  // Helper for zone color using theme colors
  const getZoneColor = (zone) => {
    switch (zone) {
      case "danger":
        return theme.palette.error.main;
      case "warning":
        return theme.palette.warning.main;
      default:
        return theme.palette.success.main;
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Location Map Overview
      </Typography>

      {/* Map Container */}
      <Paper
        sx={{
          position: "relative",
          width: "100%",
          height: 240,
          backgroundColor: theme.palette.grey[100],
          backgroundImage: `
            radial-gradient(circle at 25px 25px, ${theme.palette.grey[300]} 2px, transparent 0),
            radial-gradient(circle at 75px 75px, ${theme.palette.grey[300]} 2px, transparent 0)
          `,
          backgroundSize: "100px 100px",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        {/* Camera Location Markers */}
        {cameraLocations.map((loc) => {
          const crowdLevel = locationCrowdLevels[loc.id];
          const zoneColor = getZoneColor(crowdLevel?.zone || "safe");

          return (
            <Tooltip
              key={loc.id}
              title={
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {loc.name}
                  </Typography>
                  {loc.location && (
                    <Typography variant="body2">{loc.location}</Typography>
                  )}
                  <Typography variant="body2">
                    Count: {crowdLevel?.count || 0}
                  </Typography>
                  <Typography variant="body2">
                    Status: {crowdLevel?.zone || "safe"}
                  </Typography>
                </Box>
              }
            >
              <Box
                sx={{
                  position: "absolute",
                  left: loc.x,
                  top: loc.y,
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  backgroundColor: zoneColor,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: "0.875rem",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                  cursor: "pointer",
                  transition: "transform 0.2s ease-in-out",
                  "&:hover": {
                    transform: "scale(1.1)",
                  },
                }}
              >
                {crowdLevel?.count || 0}
              </Box>
            </Tooltip>
          );
        })}
      </Paper>

      {/* Legend */}
      <Box sx={{ display: "flex", gap: 2, mt: 2, flexWrap: "wrap" }}>
        <Chip
          icon={<DotIcon sx={{ color: theme.palette.success.main }} />}
          label="Safe Zone"
          variant="outlined"
          size="small"
        />
        <Chip
          icon={<DotIcon sx={{ color: theme.palette.warning.main }} />}
          label="Warning Zone"
          variant="outlined"
          size="small"
        />
        <Chip
          icon={<DotIcon sx={{ color: theme.palette.error.main }} />}
          label="Danger Zone"
          variant="outlined"
          size="small"
        />
      </Box>
    </Box>
  );
};

export default LocationMapView;
