import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  useTheme,
} from "@mui/material";
import { Group as GroupIcon } from "@mui/icons-material";

/**
 * Modern crowd count display component using Material-UI
 * Features:
 * - Large, prominent number display
 * - Icon and gradient styling
 * - Responsive typography
 */
const CrowdCountDisplay = ({ count = 0, peopleCount, lastUpdated }) => {
  const theme = useTheme();

  // Use count prop first, then peopleCount for backward compatibility
  const displayCount = count !== undefined ? count : peopleCount || 0;

  // Determine color based on crowd count
  const getCountColor = (count) => {
    if (count >= 120) return theme.palette.error.main;
    if (count >= 80) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  const countColor = getCountColor(displayCount);

  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${countColor}15, ${countColor}25)`,
        border: `1px solid ${countColor}30`,
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              Live People Count
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 700,
                color: countColor,
                lineHeight: 1,
              }}
            >
              {displayCount?.toLocaleString() || "0"}
            </Typography>
          </Box>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              backgroundColor: countColor,
              color: "white",
            }}
          >
            <GroupIcon sx={{ fontSize: 32 }} />
          </Avatar>
        </Box>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 1,
            color: theme.palette.text.secondary,
          }}
        >
          {lastUpdated
            ? `Last updated: ${new Date(lastUpdated).toLocaleTimeString()}`
            : "Real-time crowd monitoring"}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default CrowdCountDisplay;
