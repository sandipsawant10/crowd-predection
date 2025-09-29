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
<<<<<<< HEAD
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
=======
    <div className="bg-gradient-to-r from-slate-800 to-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-700 hover:shadow-blue-700/30 transition">
      <h2 className="text-2xl font-bold mb-6 text-purple-300 flex items-center gap-3">
        <span>📜 System Logs</span>
        <span className="inline-block px-3 py-1 bg-slate-700 text-gray-200 text-sm rounded-full font-semibold shadow">
          {logs.length} entries
        </span>
      </h2>

      {/* Download Buttons */}
      <div className="mb-5 flex gap-4">
        <button
          className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-4 py-2 rounded-lg shadow-lg transition flex items-center gap-2 ring-2 ring-blue-400/50"
          onClick={() => onDownload("json")}
        >
          <ArrowDownTrayIcon className="w-5 h-5" /> JSON
        </button>
        <button
          className="bg-green-600 hover:bg-green-700 active:scale-95 text-white px-4 py-2 rounded-lg shadow-lg transition flex items-center gap-2 ring-2 ring-green-400/50"
          onClick={() => onDownload("csv")}
        >
          <ArrowDownTrayIcon className="w-5 h-5" /> CSV
        </button>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-700">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-700 text-gray-200">
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Value</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-3 text-gray-400 text-center"
                  colSpan={3}
                >
                  No logs yet.
                </td>
              </tr>
            ) : (
              logs.map((log, idx) => (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    idx % 2 === 0 ? "bg-slate-900" : "bg-slate-800"
                  } hover:bg-slate-700`}
                >
                  <td className="px-4 py-3 text-gray-200">{log.time}</td>
                  <td className="px-4 py-3 font-semibold text-blue-300">
                    {log.type}
                  </td>
                  <td className="px-4 py-3 text-gray-100">{log.value}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
>>>>>>> ea3d40be97ff3893c60530342170df6ec42e1285
  );
}
