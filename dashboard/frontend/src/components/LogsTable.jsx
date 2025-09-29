import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Chip,
  Stack,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";

export default function LogsTable({ logs, onDownload }) {
  return (
    <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AssessmentIcon sx={{ color: "text.primary" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              System Logs
            </Typography>
            <Chip
              label={`${logs.length} entries`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        </Box>

        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => onDownload("json")}
            sx={{ borderRadius: 2 }}
          >
            Download JSON
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => onDownload("csv")}
            sx={{ borderRadius: 2 }}
          >
            Download CSV
          </Button>
        </Stack>

        <TableContainer
          component={Paper}
          sx={{ borderRadius: 2, border: 1, borderColor: "divider" }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "grey.100" }}>
                <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    sx={{ textAlign: "center", color: "text.secondary", py: 4 }}
                  >
                    No logs yet.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log, idx) => (
                  <TableRow
                    key={idx}
                    sx={{
                      "&:nth-of-type(odd)": { backgroundColor: "grey.50" },
                      "&:hover": { backgroundColor: "action.hover" },
                    }}
                  >
                    <TableCell>{log.time}</TableCell>
                    <TableCell>
                      <Typography
                        sx={{ fontWeight: 600, color: "text.primary" }}
                      >
                        {log.type}
                      </Typography>
                    </TableCell>
                    <TableCell>{log.value}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
