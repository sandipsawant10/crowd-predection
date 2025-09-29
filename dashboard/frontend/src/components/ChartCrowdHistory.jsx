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

export default function ChartCrowdHistory({ chartData }) {
  return (
<<<<<<< HEAD
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
=======
    <div className="bg-gradient-to-r from-slate-900 to-gray-900 rounded-2xl shadow-lg p-6 mb-8 border border-gray-700 hover:shadow-blue-700/30 transition">
      <h2 className="text-2xl font-bold mb-5 text-blue-300 flex items-center gap-2">
        📈 Crowd Count (Last 15 Minutes)
      </h2>
      <div className="bg-slate-800 rounded-xl p-5 shadow-inner">
        <Line
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                display: true,
                labels: { color: "#e5e7eb", font: { size: 14 } }, // light gray for visibility
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
    </div>
>>>>>>> ea3d40be97ff3893c60530342170df6ec42e1285
  );
}
