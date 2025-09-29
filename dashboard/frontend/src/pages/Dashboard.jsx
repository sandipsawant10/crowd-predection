import React, { useEffect, useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Container,
} from "@mui/material";
import DashboardLayout from "../components/DashboardLayout";
import SystemHealth from "../components/SystemHealth";
import CrowdControl from "../components/CrowdControl";
import LogsTable from "../components/LogsTable";
import ChartCrowdHistory from "../components/ChartCrowdHistory";
import ChartCrowdForecast from "../components/ChartCrowdForecast";
import CameraSelector from "../components/CameraSelector";
import ConnectionStatus from "../components/ConnectionStatus";
import AuthenticationPanel from "../components/AuthenticationPanel";
import LocationMapView from "../components/LocationMapView";
import AlertLogTable from "../components/AlertLogTable";
import AlertNotification from "../components/AlertNotification";
import CrowdCountDisplay from "../components/CrowdCountDisplay";

import { authAPI, diagnostic } from "../utils/api";
// Import the full API client and individual API objects
import api, {
  crowdAPI,
  cameraAPI,
  alertAPI,
  actionAPI,
  fetchPeopleCount,
  fetchCrowdHistory,
  fetchCrowdForecast,
} from "../utils/api";
import { downloadFile } from "../utils/download";

<<<<<<< HEAD
// Using our real API endpoints from api.js

// Initial camera locations and system health will be set inside component
=======
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
>>>>>>> ea3d40be97ff3893c60530342170df6ec42e1285

export default function Dashboard() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = checking, true/false = result
  const [userProfile, setUserProfile] = useState(null);

  // Camera locations - will be fetched from API
  const [cameraLocations, setCameraLocations] = useState([]);

  // System health state
  const [systemHealth, setSystemHealth] = useState([
    { name: "Detection Model", status: "unknown" },
    { name: "Forecasting Model", status: "unknown" },
    { name: "Alert Service", status: "unknown" },
  ]);

  const [actionsLog, setActionsLog] = useState([]);
<<<<<<< HEAD
  const [logs, setLogs] = useState([]); // No initial dummy data
=======
  const [logs, setLogs] = useState([
    { time: "10:00", type: "count", value: 120 },
    { time: "10:01", type: "prediction", value: 130 },
    { time: "10:02", type: "alert", value: "Threshold Crossed" },
  ]);
>>>>>>> ea3d40be97ff3893c60530342170df6ec42e1285
  const [peopleCount, setPeopleCount] = useState(0);
  const [crowdHistory, setCrowdHistory] = useState([]);
  const [crowdForecast, setCrowdForecast] = useState([]);
  const [alert, setAlert] = useState("");
  const [popupAlert, setPopupAlert] = useState(false);
  const [alertLog, setAlertLog] = useState([]);
<<<<<<< HEAD
  const [selectedCamera, setSelectedCamera] = useState(""); // Will be set when cameras are loaded
  const [locationCrowdLevels, setLocationCrowdLevels] = useState({});

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we have a token
        const authResult = await diagnostic.checkAuth();
        console.log("Auth check result:", authResult);

        if (authResult.authenticated) {
          // Get user profile
          const profile = await authAPI.getProfile();
          setUserProfile(profile.data || { name: "User" });
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Handle successful login
  const handleLoginSuccess = (profile) => {
    setIsAuthenticated(true);
    setUserProfile(profile.data || { name: "User" });
  };

  // Handle logout
  const handleLogout = () => {
    authAPI.logout();
    setIsAuthenticated(false);
    setUserProfile(null);
  };

  // Fetch camera data from API
  useEffect(() => {
    // Skip if not authenticated
    if (!isAuthenticated) return;

    const fetchCameras = async () => {
      try {
        // Get all active cameras
        const response = await cameraAPI.getAllCameras();

        if (response.data && response.data.length > 0) {
          // Map camera data to include display coordinates
          // In a real app, these coordinates would be stored with the camera data
          // Here we're assigning some placeholder coordinates
          const cameras = response.data.map((camera, index) => {
            // Generate coordinates based on index for demo
            const x = 50 + (index % 3) * 150;
            const y = 60 + Math.floor(index / 3) * 100;

            return {
              id: camera._id || camera.id,
              name: camera.name || `Camera ${index + 1}`,
              location: camera.location || "",
              x,
              y,
            };
          });

          setCameraLocations(cameras);

          // If we don't have a selected camera yet, select the first one
          if (!selectedCamera && cameras.length > 0) {
            setSelectedCamera(cameras[0].id);
          }

          // Initialize locationCrowdLevels with the camera IDs
          const initialLevels = {};
          cameras.forEach((cam) => {
            initialLevels[cam.id] = { count: 0, zone: "safe" };
          });

          setLocationCrowdLevels((prev) => ({
            ...initialLevels,
            ...prev, // Keep any existing values
          }));
        }
      } catch (err) {
        console.error("Error fetching cameras:", err);
        // Keep default cameras if API fails
      }
    };

    fetchCameras();
    // We only need to fetch cameras once on component mount
  }, [isAuthenticated]); // Add isAuthenticated as a dependency
=======
  const [selectedCamera, setSelectedCamera] = useState(CAMERA_LOCATIONS[0].id);
  const [locationCrowdLevels, setLocationCrowdLevels] = useState({
    gate1: { count: 80, zone: "safe" },
    platform3: { count: 130, zone: "danger" },
    exit: { count: 100, zone: "warning" },
  });
>>>>>>> ea3d40be97ff3893c60530342170df6ec42e1285

  useEffect(() => {
    // Skip if not authenticated
    if (!isAuthenticated) return;

    const fetchCount = async () => {
      try {
        // Use selectedCamera here for camera-specific counts
        const data = await fetchPeopleCount(selectedCamera);
        setPeopleCount(data.count);

        // Update the crowd level for the current camera
        setLocationCrowdLevels((prev) => ({
          ...prev,
          [selectedCamera]: { count: data.count, zone: data.zone },
        }));

        // Show alert if count exceeds threshold
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

          // Optionally create an alert in the backend
          try {
            await alertAPI.createAlert({
              cameraId: selectedCamera,
              alertType: "threshold_exceeded",
              count: data.count,
              message: `Crowd threshold exceeded: ${data.count} people`,
              severity: "high",
            });
          } catch (alertErr) {
            console.error("Failed to create alert:", alertErr);
          }
        } else {
          setPopupAlert(false);
        }
<<<<<<< HEAD
      } catch (err) {
        console.error("Error fetching count data:", err);
=======
      } catch {
>>>>>>> ea3d40be97ff3893c60530342170df6ec42e1285
        setPeopleCount(0);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 5000);
    return () => clearInterval(interval);
  }, [selectedCamera, isAuthenticated]); // Added isAuthenticated as dependency

  useEffect(() => {
    // Skip if not authenticated
    if (!isAuthenticated) return;

    const fetchHistory = async () => {
      try {
        // Get crowd history for the selected camera, last 15 data points
        const data = await fetchCrowdHistory(selectedCamera, 15);
        setCrowdHistory(data.history);
<<<<<<< HEAD

        // Optionally, we could also add logic to add to logs here
        if (data.history && data.history.length > 0) {
          setLogs((prev) => {
            // Add the latest history point to logs if it doesn't exist
            const latestPoint = data.history[data.history.length - 1];
            const exists = prev.some(
              (log) =>
                log.time === latestPoint.time &&
                log.type === "count" &&
                log.value === latestPoint.count
            );

            if (!exists) {
              return [
                {
                  time: latestPoint.time,
                  type: "count",
                  value: latestPoint.count,
                },
                ...prev.slice(0, 19), // Keep last 20 logs
              ];
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("Error fetching crowd history:", err);
=======
      } catch {
>>>>>>> ea3d40be97ff3893c60530342170df6ec42e1285
        setCrowdHistory([]);
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 10000);
    return () => clearInterval(interval);
  }, [selectedCamera, isAuthenticated]); // Added isAuthenticated as dependency

  useEffect(() => {
    // Skip if not authenticated
    if (!isAuthenticated) return;

    const fetchForecast = async () => {
      try {
        const data = await fetchCrowdForecast(selectedCamera);
        setCrowdForecast(data.forecast);

        // Check for danger zones in the forecast
        const danger = data.forecast.find((item) => item.zone === "danger");
        if (danger) {
          const alertMessage = `⚠ Predicted overcrowding in ${danger.in} mins.`;
          setAlert(alertMessage);

          // Add to alert log
          setAlertLog((prev) => [
            {
              time: new Date().toLocaleTimeString(),
              count: danger.count,
              type: "Forecast Danger",
            },
            ...prev,
          ]);

          // Add to logs for historical tracking
          setLogs((prev) => [
            {
              time: new Date().toLocaleTimeString(),
              type: "prediction",
              value: danger.count,
            },
            ...prev.slice(0, 19), // Keep last 20 logs
          ]);

          // Optionally create a predictive alert in the backend
          try {
            await alertAPI.createAlert({
              cameraId: selectedCamera,
              alertType: "prediction_warning",
              count: danger.count,
              message: alertMessage,
              severity: "medium",
              predictedTime: new Date(
                Date.now() + danger.in * 60 * 1000
              ).toISOString(),
            });
          } catch (alertErr) {
            console.error("Failed to create predictive alert:", alertErr);
          }
        } else {
          setAlert("");
        }
<<<<<<< HEAD
      } catch (err) {
        console.error("Error fetching crowd forecast:", err);
=======
      } catch {
>>>>>>> ea3d40be97ff3893c60530342170df6ec42e1285
        setCrowdForecast([]);
        setAlert("");
      }
    };

    fetchForecast();
    const interval = setInterval(fetchForecast, 10000);
    return () => clearInterval(interval);
  }, [selectedCamera, isAuthenticated]); // Added isAuthenticated as dependency

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

<<<<<<< HEAD
  // Authority control handlers
  const handleRedirectCrowd = async () => {
    const actionDetails = {
      time: new Date().toLocaleTimeString(),
      action: "Redirect Crowd",
      details: `Extra gates/signboards triggered for ${selectedCamera}`,
    };

    try {
      // Record the action in the backend
      await actionAPI.recordAction({
        cameraId: selectedCamera,
        actionType: "redirect_crowd",
        details: actionDetails.details,
        timestamp: new Date().toISOString(),
      });

      // Update local logs
      setActionsLog((prev) => [actionDetails, ...prev]);

      // Add to the main logs
      setLogs((prev) => [
        {
          time: actionDetails.time,
          type: "action",
          value: actionDetails.action,
        },
        ...prev.slice(0, 19), // Keep last 20 logs
      ]);

      alert("Redirect Crowd action triggered!");
    } catch (err) {
      console.error("Failed to record action:", err);
      // Still update the local UI even if API fails
      setActionsLog((prev) => [actionDetails, ...prev]);
      alert("Redirect Crowd action triggered! (Note: Server sync failed)");
    }
=======
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
>>>>>>> ea3d40be97ff3893c60530342170df6ec42e1285
  };

  const handleRequestPolice = async () => {
    const actionDetails = {
      time: new Date().toLocaleTimeString(),
      action: "Request Police/Staff",
      details: `Request sent for ${selectedCamera}`,
    };

    try {
      // Record the action in the backend
      await actionAPI.recordAction({
        cameraId: selectedCamera,
        actionType: "request_police",
        details: actionDetails.details,
        timestamp: new Date().toISOString(),
        urgency: "high",
      });

      // Update local logs
      setActionsLog((prev) => [actionDetails, ...prev]);

      // Add to the main logs
      setLogs((prev) => [
        {
          time: actionDetails.time,
          type: "action",
          value: actionDetails.action,
        },
        ...prev.slice(0, 19), // Keep last 20 logs
      ]);

      alert("Request Police/Staff action triggered!");
    } catch (err) {
      console.error("Failed to record action:", err);
      // Still update the local UI even if API fails
      setActionsLog((prev) => [actionDetails, ...prev]);
      alert(
        "Request Police/Staff action triggered! (Note: Server sync failed)"
      );
    }
  };

<<<<<<< HEAD
  // Fetch system health status
  useEffect(() => {
    // Skip if not authenticated
    if (!isAuthenticated) return;

    const fetchSystemHealth = async () => {
      try {
        // In a real implementation, you would have an endpoint for this
        // Here we'll simulate by checking if we can access various endpoints

        let services = [];

        // Check detection model status - simulated by checking if crowd data is available
        try {
          await crowdAPI.getLatest();
          services.push({ name: "Detection Model", status: "running" });
        } catch (err) {
          services.push({ name: "Detection Model", status: "stopped" });
        }

        // Check forecasting model - simulated by checking if forecast data is available
        try {
          const forecast = await fetchCrowdForecast(selectedCamera);
          if (forecast && forecast.forecast && forecast.forecast.length > 0) {
            services.push({ name: "Forecasting Model", status: "running" });
          } else {
            services.push({ name: "Forecasting Model", status: "stopped" });
          }
        } catch (err) {
          services.push({ name: "Forecasting Model", status: "stopped" });
        }

        // Check alert service - simulated by checking if alerts API is available
        try {
          await alertAPI.getAlerts({ limit: 1 });
          services.push({ name: "Alert Service", status: "running" });
        } catch (err) {
          services.push({ name: "Alert Service", status: "stopped" });
        }

        setSystemHealth(services);
      } catch (err) {
        console.error("Error checking system health:", err);
        // Keep existing status if there's an error
      }
    };

    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [selectedCamera, isAuthenticated]); // Added isAuthenticated as dependency

  // Download logs as JSON or CSV
=======
>>>>>>> ea3d40be97ff3893c60530342170df6ec42e1285
  const downloadLogs = (format) => {
    downloadFile(logs, format, "logs");
  };

  return (
<<<<<<< HEAD
    <>
      {/* Show authentication panel if not authenticated */}
      <AuthenticationPanel
        isAuthenticated={isAuthenticated}
        isLoading={isAuthenticated === null}
        userProfile={userProfile}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />

      {/* Show dashboard layout if authenticated */}
      {isAuthenticated && (
        <DashboardLayout
          userProfile={userProfile}
          onLogout={handleLogout}
          isAuthenticated={isAuthenticated}
        >
          {/* Alert Notification Overlay */}
          <AlertNotification show={popupAlert} peopleCount={peopleCount} />

          {/* Main Dashboard Grid */}
          <Grid container spacing={3}>
            {/* Connection Status & System Health */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">System Status</Typography>
                    <ConnectionStatus />
                  </Box>
                  <SystemHealth health={systemHealth} />
                </CardContent>
              </Card>
            </Grid>

            {/* Camera Selection */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Camera Selection
                  </Typography>
                  <CameraSelector
                    locations={cameraLocations}
                    selected={selectedCamera}
                    onChange={setSelectedCamera}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Live People Count */}
            <Grid item xs={12} md={6}>
              <CrowdCountDisplay peopleCount={peopleCount} />
            </Grid>

            {/* Location Map View */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <LocationMapView
                    cameraLocations={cameraLocations}
                    locationCrowdLevels={locationCrowdLevels}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Crowd Control Actions */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <CrowdControl
                    onRedirect={handleRedirectCrowd}
                    onRequestPolice={handleRequestPolice}
                    actionsLog={actionsLog}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Charts Section */}
            <Grid item xs={12} lg={6}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <ChartCrowdHistory chartData={chartData} />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} lg={6}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <ChartCrowdForecast
                    chartData={forecastChartData}
                    alert={alert}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Alert Log Table */}
            <Grid item xs={12} lg={6}>
              <Card>
                <CardContent>
                  <AlertLogTable alertLog={alertLog} />
                </CardContent>
              </Card>
            </Grid>

            {/* System Logs */}
            <Grid item xs={12} lg={6}>
              <Card>
                <CardContent>
                  <LogsTable logs={logs} onDownload={downloadLogs} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DashboardLayout>
      )}
    </>
=======
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
>>>>>>> ea3d40be97ff3893c60530342170df6ec42e1285
  );
}
