import React from "react";
import { Line } from "react-chartjs-2";
import { Card, CardContent, Typography, Box, Alert } from "@mui/material";
import { TrendingUp as TrendingUpIcon } from "@mui/icons-material";
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

export default function ChartCrowdForecast({ chartData, alert }) {
  return (
    <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <TrendingUpIcon sx={{ color: "secondary.main" }} />
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: "secondary.main" }}
          >
            Future Crowd Growth (Next 10 Minutes)
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: "secondary.light",
            borderRadius: 2,
            p: 2,
            "& canvas": {
              borderRadius: 1,
            },
          }}
        >
          <Line data={chartData} />
        </Box>
        {alert && (
          <Alert
            severity="warning"
            sx={{
              mt: 2,
              fontWeight: 600,
              borderRadius: 2,
            }}
          >
            {alert}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
