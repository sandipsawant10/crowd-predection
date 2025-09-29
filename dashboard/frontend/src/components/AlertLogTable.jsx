import React from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  useTheme,
} from "@mui/material";
import {
  AccessTime as TimeIcon,
  Group as GroupIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";

/**
 * Modern alert log table with Material-UI styling
 * Features:
 * - Clean table design with proper spacing
 * - Color-coded alert types
 * - Icons for visual clarity
 * - Empty state with helpful message
 */
const AlertLogTable = ({ alertLog }) => {
  const theme = useTheme();

  const getAlertTypeColor = (type) => {
    switch (type) {
      case "Threshold Crossed":
        return "error";
      case "Forecast Danger":
        return "warning";
      default:
        return "info";
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Alert Log
      </Typography>

      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TimeIcon fontSize="small" />
                  Time
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <GroupIcon fontSize="small" />
                  Count
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <WarningIcon fontSize="small" />
                  Type
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alertLog.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No alerts recorded yet
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              alertLog.map((log, idx) => (
                <TableRow
                  key={idx}
                  sx={{
                    "&:hover": {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                >
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: "monospace" }}
                    >
                      {log.time}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {log.count}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.type}
                      size="small"
                      color={getAlertTypeColor(log.type)}
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AlertLogTable;
