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
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function ChartCrowdForecast({ chartData, alert }) {
  return (
<<<<<<< HEAD
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
=======
    <div className="bg-gradient-to-r from-slate-900 to-gray-900 rounded-2xl shadow-lg p-6 mb-8 border border-gray-700 hover:shadow-purple-700/30 transition">
      <h2 className="text-2xl font-bold mb-4 text-purple-300 flex items-center gap-2">
        🚦 Forecasted Crowd Growth (Next 10 Minutes)
      </h2>
      <div className="bg-slate-800 rounded-xl p-5 shadow-inner">
        <Line
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                display: true,
                labels: { color: "#e5e7eb", font: { size: 14 } },
              },
            },
            scales: {
              x: {
                ticks: { color: "#e5e7eb" },
                grid: { color: "rgba(255,255,255,0.1)" },
              },
              y: {
                ticks: { color: "#e5e7eb" },
                grid: { color: "rgba(255,255,255,0.1)" },
              },
            },
          }}
        />
      </div>
      {alert && (
        <div className="mt-4 p-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg font-semibold shadow-md border-l-4 border-red-400">
          {alert}
        </div>
      )}
    </div>
>>>>>>> ea3d40be97ff3893c60530342170df6ec42e1285
  );
}
