import React from "react";
import { Snackbar, Alert, AlertTitle, Slide } from "@mui/material";
import { Warning as WarningIcon } from "@mui/icons-material";

/**
 * Modern alert notification using Material-UI Snackbar
 * Features:
 * - Professional slide-in animation
 * - Material Design alert styling
 * - Proper z-index positioning
 */
const AlertNotification = ({ show, peopleCount }) => {
  return (
    <Snackbar
      open={show}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      TransitionComponent={Slide}
      TransitionProps={{ direction: "down" }}
      sx={{ zIndex: 9999 }}
    >
      <Alert
        severity="warning"
        variant="filled"
        icon={<WarningIcon />}
        sx={{
          minWidth: 300,
          "& .MuiAlert-message": {
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          },
        }}
      >
        <AlertTitle sx={{ mb: 0.5, fontWeight: 600 }}>
          Crowd Threshold Exceeded!
        </AlertTitle>
        Current count: {peopleCount} people
      </Alert>
    </Snackbar>
  );
};

export default AlertNotification;
