import React from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
} from "@mui/material";
import {
  DirectionsWalk as RedirectIcon,
  Security as PoliceIcon,
  AccessTime as TimeIcon,
} from "@mui/icons-material";

/**
 * Modern crowd control component with Material-UI styling
 * Features:
 * - Action buttons with clear icons and colors
 * - Professional actions log table
 * - Responsive button layout
 * - Consistent Material Design patterns
 */
export default function CrowdControl({
  onRedirect,
  onRequestPolice,
  actionsLog,
}) {
  const theme = useTheme();

  return (
<<<<<<< HEAD
    <Box>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        Emergency Crowd Control Actions
      </Typography>

      {/* Action Buttons */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            startIcon={<RedirectIcon />}
            onClick={onRedirect}
            sx={{
              py: 1.5,
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            Redirect Crowd Flow
          </Button>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Button
            fullWidth
            variant="contained"
            color="error"
            size="large"
            startIcon={<PoliceIcon />}
            onClick={onRequestPolice}
            sx={{
              py: 1.5,
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            Request Security/Police
          </Button>
        </Grid>
      </Grid>

      {/* Actions Log */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Action Log
        </Typography>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TimeIcon fontSize="small" />
                    Time
                  </Box>
                </TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {actionsLog.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} sx={{ textAlign: "center", py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No actions recorded yet
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                actionsLog.map((log, idx) => (
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
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: log.action.includes("Police")
                            ? theme.palette.error.main
                            : theme.palette.primary.main,
                        }}
                      >
                        {log.action}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{log.details}</Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
=======
    <div className="mb-10 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-gray-900 shadow-xl border border-gray-700 hover:shadow-purple-700/30 transition">
      {/* Action Buttons */}
      <div className="flex gap-6 mb-6">
        <button
          className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all flex items-center gap-2 ring-2 ring-blue-400/50"
          onClick={onRedirect}
        >
          <ArrowPathIcon className="w-5 h-5" /> Redirect Crowd
        </button>
        <button
          className="bg-red-600 hover:bg-red-700 active:scale-95 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all flex items-center gap-2 ring-2 ring-red-400/50"
          onClick={onRequestPolice}
        >
          <ShieldCheckIcon className="w-5 h-5" /> Request Police/Staff
        </button>
      </div>

      {/* Actions Log */}
      <div className="bg-slate-800 rounded-2xl shadow p-6 border border-gray-700">
        <h2 className="text-2xl font-bold mb-5 text-purple-300 flex items-center gap-2">
          📋 Crowd Control Actions Log
        </h2>
        <div className="overflow-hidden rounded-xl border border-gray-700">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-700 text-gray-200">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {actionsLog.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-3 text-gray-400 text-center"
                    colSpan={3}
                  >
                    No actions yet.
                  </td>
                </tr>
              ) : (
                actionsLog.map((log, idx) => (
                  <tr
                    key={idx}
                    className={`${
                      idx % 2 === 0 ? "bg-slate-900" : "bg-slate-800"
                    } hover:bg-slate-700 transition`}
                  >
                    <td className="px-4 py-3 text-gray-200">{log.time}</td>
                    <td className="px-4 py-3 font-semibold text-blue-300">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-gray-100">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
>>>>>>> ea3d40be97ff3893c60530342170df6ec42e1285
  );
}
