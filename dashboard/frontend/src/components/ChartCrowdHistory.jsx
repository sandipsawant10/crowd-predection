import React from "react";
import { Line } from "react-chartjs-2";
import { Card, CardContent, Typography, Box } from "@mui/material";
import { BarChart as BarChartIcon } from "@mui/icons-material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ChartCrowdHistory({ chartData }) {
  return (
    <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <BarChartIcon sx={{ color: "primary.main" }} />
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: "primary.main" }}
          >
            Crowd Count (Last 15 Minutes)
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: "primary.light",
            borderRadius: 2,
            p: 2,
            "& canvas": {
              borderRadius: 1,
            },
          }}
        >
          <Line data={chartData} />
        </Box>
      </CardContent>
    </Card>
  );
}
