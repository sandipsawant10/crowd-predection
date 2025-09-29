import React, { useEffect, useState } from "react";
import SystemHealth from "../components/SystemHealth";
import CrowdControl from "../components/CrowdControl";
import LogsTable from "../components/LogsTable";
import ChartCrowdHistory from "../components/ChartCrowdHistory";
import ChartCrowdForecast from "../components/ChartCrowdForecast";
import CameraSelector from "../components/CameraSelector";
import {
  fetchPeopleCount,
  fetchCrowdHistory,
  fetchCrowdForecast,
} from "../utils/api";
import { downloadFile } from "../utils/download";

// Dummy API endpoints
const PEOPLE_COUNT_API = "/api/people_count";
const CROWD_HISTORY_API = "/api/crowd_history";
const CROWD_FORECAST_API = "/api/crowd_forecast";

const CAMERA_LOCATIONS = [
  { id: "gate1", name: "Station Gate 1", x: 50, y: 80 },
  { id: "platform3", name: "Platform 3", x: 200, y: 120 },
  { id: "exit", name: "Exit Gate", x: 350, y: 60 },
];

// Dummy system health data
const SYSTEM_HEALTH = [
  { name: "Detection Model", status: "running" },
  { name: "Forecasting Model", status: "running" },
  { name: "Alert Service", status: "stopped" },
];

export default function Dashboard() {
  const [actionsLog, setActionsLog] = useState([]);
  const [logs, setLogs] = useState([
    { time: "10:00", type: "count", value: 120 },
    { time: "10:01", type: "prediction", value: 130 },
    { time: "10:02", type: "alert", value: "Threshold Crossed" },
  ]); // Dummy logs, replace with API
  const [peopleCount, setPeopleCount] = useState(0);
  const [crowdHistory, setCrowdHistory] = useState([]);
  const [crowdForecast, setCrowdForecast] = useState([]);
  const [alert, setAlert] = useState("");
  const [popupAlert, setPopupAlert] = useState(false);
  const [alertLog, setAlertLog] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(CAMERA_LOCATIONS[0].id);
  const [locationCrowdLevels, setLocationCrowdLevels] = useState({
    gate1: { count: 80, zone: "safe" },
    platform3: { count: 130, zone: "danger" },
    exit: { count: 100, zone: "warning" },
  }); // Dummy data, replace with API

  // Fetch live people count
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const data = await fetchPeopleCount(PEOPLE_COUNT_API);
        setPeopleCount(data.count);
        if (data.count >= 120) {
          setPopupAlert(true);
          setAlertLog((prev) => [
            {
              time: new Date().toLocaleTimeString(),
              count: data.count,
              type: "Threshold Crossed",
            },
            ...prev,
          ]);
        } else {
          setPopupAlert(false);
        }
      } catch (err) {
        setPeopleCount(0);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch crowd history for chart
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await fetchCrowdHistory(CROWD_HISTORY_API);
        setCrowdHistory(data.history);
      } catch (err) {
        setCrowdHistory([]);
      }
    };
    fetchHistory();
    const interval = setInterval(fetchHistory, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch crowd forecast for next 10 minutes
  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const data = await fetchCrowdForecast(CROWD_FORECAST_API);
        setCrowdForecast(data.forecast);
        const danger = data.forecast.find((item) => item.zone === "danger");
        if (danger) {
          setAlert(`⚠ Predicted overcrowding in ${danger.in} mins.`);
          setAlertLog((prev) => [
            {
              time: new Date().toLocaleTimeString(),
              count: danger.count,
              type: "Forecast Danger",
            },
            ...prev,
          ]);
        } else {
          setAlert("");
        }
      } catch (err) {
        setCrowdForecast([]);
        setAlert("");
      }
    };
    fetchForecast();
    const interval = setInterval(fetchForecast, 10000);
    return () => clearInterval(interval);
  }, []);

  // Chart data
  const chartData = {
    labels: crowdHistory.map((item) => item.time),
    datasets: [
      {
        label: "Crowd Count",
        data: crowdHistory.map((item) => item.count),
        fill: false,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };

  // Forecast chart data
  const forecastChartData = {
    labels: crowdForecast.map((item) => `${item.in} min`),
    datasets: [
      {
        label: "Predicted Crowd",
        data: crowdForecast.map((item) => item.count),
        fill: false,
        borderColor: crowdForecast.map((item) => {
          if (item.zone === "danger") return "#ef4444";
          if (item.zone === "warning") return "#facc15";
          return "#22c55e";
        }),
        tension: 0.1,
      },
    ],
  };

  // Helper for zone color
  const getZoneColor = (zone) => {
    if (zone === "danger") return "bg-red-500";
    if (zone === "warning") return "bg-yellow-400";
    return "bg-green-500";
  };

  // Authority control handlers
  const handleRedirectCrowd = () => {
    setActionsLog((prev) => [
      {
        time: new Date().toLocaleTimeString(),
        action: "Redirect Crowd",
        details: `Extra gates/signboards triggered for ${selectedCamera}`,
      },
      ...prev,
    ]);
    alert("Redirect Crowd action triggered!");
  };

  const handleRequestPolice = () => {
    setActionsLog((prev) => [
      {
        time: new Date().toLocaleTimeString(),
        action: "Request Police/Staff",
        details: `Request sent for ${selectedCamera}`,
      },
      ...prev,
    ]);
    alert("Request Police/Staff action triggered!");
  };

  // Download logs as JSON or CSV
  const downloadLogs = (format) => {
    downloadFile(logs, format, "logs");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Smart Crowd Dashboard</h1>
      <SystemHealth health={SYSTEM_HEALTH} />
      <CameraSelector
        locations={CAMERA_LOCATIONS}
        selected={selectedCamera}
        onChange={setSelectedCamera}
      />
      {/* Map View with Crowd Indicators */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Location Map</h2>
        <div className="relative w-full h-48 bg-gray-200 rounded">
          {CAMERA_LOCATIONS.map((loc) => (
            <div
              key={loc.id}
              className={`absolute rounded-full w-10 h-10 flex items-center justify-center text-white font-bold shadow-lg ${getZoneColor(
                locationCrowdLevels[loc.id]?.zone
              )}`}
              style={{ left: loc.x, top: loc.y }}
              title={loc.name}
            >
              {locationCrowdLevels[loc.id]?.count}
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-2">
          <span className="flex items-center">
            <span className="w-4 h-4 bg-green-500 rounded-full mr-1"></span>Safe
          </span>
          <span className="flex items-center">
            <span className="w-4 h-4 bg-yellow-400 rounded-full mr-1"></span>
            Warning
          </span>
          <span className="flex items-center">
            <span className="w-4 h-4 bg-red-500 rounded-full mr-1"></span>Danger
          </span>
        </div>
      </div>
      <CrowdControl
        onRedirect={handleRedirectCrowd}
        onRequestPolice={handleRequestPolice}
        actionsLog={actionsLog}
      />
      {popupAlert && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-400 text-black px-6 py-3 rounded shadow-lg font-bold text-lg">
          🚨 Crowd threshold crossed! ({peopleCount})
        </div>
      )}
      <div className="bg-white rounded shadow p-4 mb-6 flex items-center justify-between">
        <span className="text-lg">Live People Count:</span>
        <span className="text-3xl font-bold text-blue-600">{peopleCount}</span>
      </div>
      <ChartCrowdHistory chartData={chartData} />
      <ChartCrowdForecast chartData={forecastChartData} alert={alert} />
      {/* Alert Log Table */}
      <div className="bg-white rounded shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Alert Log</h2>
        <table className="w-full text-left border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1">Time</th>
              <th className="px-2 py-1">Crowd Count</th>
              <th className="px-2 py-1">Type</th>
            </tr>
          </thead>
          <tbody>
            {alertLog.length === 0 ? (
              <tr>
                <td className="px-2 py-1" colSpan={3}>
                  No alerts yet.
                </td>
              </tr>
            ) : (
              alertLog.map((log, idx) => (
                <tr key={idx}>
                  <td className="px-2 py-1">{log.time}</td>
                  <td className="px-2 py-1">{log.count}</td>
                  <td className="px-2 py-1">{log.type}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <LogsTable logs={logs} onDownload={downloadLogs} />
    </div>
  );
}
