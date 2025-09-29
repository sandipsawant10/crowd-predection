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

// Using our real API endpoints from api.js

// Initial camera locations and system health will be set inside component

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
  const [logs, setLogs] = useState([]); // No initial dummy data
  const [peopleCount, setPeopleCount] = useState(0);
  const [crowdHistory, setCrowdHistory] = useState([]);
  const [crowdForecast, setCrowdForecast] = useState([]);
  const [alert, setAlert] = useState("");
  const [popupAlert, setPopupAlert] = useState(false);
  const [alertLog, setAlertLog] = useState([]);
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

  // Fetch live people count
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
      } catch (err) {
        console.error("Error fetching count data:", err);
        setPeopleCount(0);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 5000);
    return () => clearInterval(interval);
  }, [selectedCamera, isAuthenticated]); // Added isAuthenticated as dependency

  // Fetch crowd history for chart
  useEffect(() => {
    // Skip if not authenticated
    if (!isAuthenticated) return;

    const fetchHistory = async () => {
      try {
        // Get crowd history for the selected camera, last 15 data points
        const data = await fetchCrowdHistory(selectedCamera, 15);
        setCrowdHistory(data.history);

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
        setCrowdHistory([]);
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 10000);
    return () => clearInterval(interval);
  }, [selectedCamera, isAuthenticated]); // Added isAuthenticated as dependency

  // Fetch crowd forecast for next 10 minutes
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
      } catch (err) {
        console.error("Error fetching crowd forecast:", err);
        setCrowdForecast([]);
        setAlert("");
      }
    };

    fetchForecast();
    const interval = setInterval(fetchForecast, 10000);
    return () => clearInterval(interval);
  }, [selectedCamera, isAuthenticated]); // Added isAuthenticated as dependency

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
  const downloadLogs = (format) => {
    downloadFile(logs, format, "logs");
  };

  return (
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
  );
}
