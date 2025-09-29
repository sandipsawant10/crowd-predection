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

export default function ChartCrowdForecast({ chartData, alert }) {
  return (
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
  );
}
