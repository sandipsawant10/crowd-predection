import React from "react";
import { Line } from "react-chartjs-2";
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
  );
}
