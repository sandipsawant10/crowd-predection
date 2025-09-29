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

const PEOPLE_COUNT_API = "/api/people_count";
const CROWD_HISTORY_API = "/api/crowd_history";
const CROWD_FORECAST_API = "/api/crowd_forecast";

const CAMERA_LOCATIONS = [
  { id: "gate1", name: "Station Gate 1", x: 50, y: 80 },
  { id: "platform3", name: "Platform 3", x: 200, y: 120 },
  { id: "exit", name: "Exit Gate", x: 350, y: 60 },
];

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
  ]);
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
  });

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
      } catch {
        setPeopleCount(0);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await fetchCrowdHistory(CROWD_HISTORY_API);
        setCrowdHistory(data.history);
      } catch {
        setCrowdHistory([]);
      }
    };
    fetchHistory();
    const interval = setInterval(fetchHistory, 10000);
    return () => clearInterval(interval);
  }, []);

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
      } catch {
        setCrowdForecast([]);
        setAlert("");
      }
    };
    fetchForecast();
    const interval = setInterval(fetchForecast, 10000);
    return () => clearInterval(interval);
  }, []);

  const chartData = {
    labels: crowdHistory.map((item) => item.time),
    datasets: [
      {
        label: "Crowd Count",
        data: crowdHistory.map((item) => item.count),
        fill: true,
        borderColor: "#60a5fa",
        backgroundColor: "rgba(96,165,250,0.2)",
        tension: 0.3,
      },
    ],
  };

  const forecastChartData = {
    labels: crowdForecast.map((item) => `${item.in} min`),
    datasets: [
      {
        label: "Predicted Crowd",
        data: crowdForecast.map((item) => item.count),
        fill: true,
        borderColor: "#a855f7",
        backgroundColor: "rgba(168,85,247,0.2)",
        tension: 0.3,
      },
    ],
  };

  const getZoneColor = (zone) => {
    if (zone === "danger") return "bg-red-600 ring-4 ring-red-400 animate-pulse";
    if (zone === "warning") return "bg-yellow-500 ring-4 ring-yellow-300";
    return "bg-green-600 ring-4 ring-green-300";
  };

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

  const downloadLogs = (format) => {
    downloadFile(logs, format, "logs");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 bg-gradient-to-br from-slate-900 via-gray-900 to-black min-h-screen text-gray-100">
      {/* Dashboard Title */}
      <h1 className="text-4xl font-extrabold text-center bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-wide drop-shadow-lg">
        🚦 Smart Crowd & Traffic Dashboard
      </h1>

      {/* System Health */}
      <SystemHealth health={SYSTEM_HEALTH} />

      {/* Camera Selector */}
      <CameraSelector
        locations={CAMERA_LOCATIONS}
        selected={selectedCamera}
        onChange={setSelectedCamera}
      />

      {/* Location Map */}
      <div className="mb-8 bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl shadow-2xl p-6 border border-gray-700 hover:shadow-purple-700/30 transition">
        <h2 className="text-xl font-semibold mb-4 text-blue-300">
          🗺 Location Map
        </h2>
        <div className="relative w-full h-56 bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl shadow-inner">
          {CAMERA_LOCATIONS.map((loc) => (
            <div
              key={loc.id}
              className={`absolute rounded-full w-12 h-12 flex items-center justify-center text-white font-bold shadow-xl ${getZoneColor(
                locationCrowdLevels[loc.id]?.zone
              )}`}
              style={{ left: loc.x, top: loc.y }}
              title={loc.name}
            >
              {locationCrowdLevels[loc.id]?.count}
            </div>
          ))}
        </div>
        <div className="flex gap-6 mt-4 text-sm text-gray-300">
          <span className="flex items-center">
            <span className="w-4 h-4 bg-green-600 rounded-full mr-2"></span>
            Safe
          </span>
          <span className="flex items-center">
            <span className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></span>
            Warning
          </span>
          <span className="flex items-center">
            <span className="w-4 h-4 bg-red-600 rounded-full mr-2"></span>
            Danger
          </span>
        </div>
      </div>

      {/* Crowd Control */}
      <CrowdControl
        onRedirect={handleRedirectCrowd}
        onRequestPolice={handleRequestPolice}
        actionsLog={actionsLog}
      />

      {/* Popup Alert */}
      {popupAlert && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-8 py-4 rounded-xl shadow-2xl font-bold text-lg animate-bounce">
          🚨 Crowd threshold crossed! ({peopleCount})
        </div>
      )}

      {/* Live Count */}
      <div className="bg-gradient-to-r from-indigo-700 to-blue-700 rounded-2xl shadow-lg p-6 flex items-center justify-between text-white">
        <span className="text-lg font-medium">👥 Live People Count:</span>
        <span className="text-4xl font-extrabold drop-shadow">{peopleCount}</span>
      </div>

      {/* Charts */}
      <ChartCrowdHistory chartData={chartData} />
      <ChartCrowdForecast chartData={forecastChartData} alert={alert} />

      {/* Alert Log */}
      <div className="bg-gradient-to-r from-slate-800 to-gray-800 rounded-2xl shadow-lg p-6 border border-gray-700 hover:shadow-indigo-700/30 transition">
        <h2 className="text-xl font-semibold mb-4 text-purple-300">
          🔔 Alert Log
        </h2>
        <div className="overflow-hidden rounded-xl border border-gray-700">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-700 text-gray-200">
                <th className="px-3 py-3">Time</th>
                <th className="px-3 py-3">Crowd Count</th>
                <th className="px-3 py-3">Type</th>
              </tr>
            </thead>
            <tbody>
              {alertLog.length === 0 ? (
                <tr>
                  <td
                    className="px-3 py-3 text-gray-400 text-center"
                    colSpan={3}
                  >
                    No alerts yet.
                  </td>
                </tr>
              ) : (
                alertLog.map((log, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-700 transition-colors even:bg-slate-800"
                  >
                    <td className="px-3 py-3">{log.time}</td>
                    <td className="px-3 py-3">{log.count}</td>
                    <td className="px-3 py-3 font-medium">{log.type}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logs Table */}
      <LogsTable logs={logs} onDownload={downloadLogs} />
    </div>
  );
}
