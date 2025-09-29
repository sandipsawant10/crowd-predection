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
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-xl font-bold mb-4 text-purple-700">
        Future Crowd Growth (Next 10 Minutes)
      </h2>
      <div className="bg-purple-50 rounded-lg p-4">
        <Line data={chartData} />
      </div>
      {alert && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg font-semibold shadow">
          {alert}
        </div>
      )}
    </div>
  );
}
