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
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-xl font-bold mb-4 text-blue-700">
        Crowd Count (Last 15 Minutes)
      </h2>
      <div className="bg-blue-50 rounded-lg p-4">
        <Line data={chartData} />
      </div>
    </div>
  );
}
