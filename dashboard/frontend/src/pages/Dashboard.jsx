import React, { useEffect, useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  Box,
  Typography,
  Button,
} from "@mui/material";
import DashboardLayout from "../components/DashboardLayout";
import SystemHealth from "../components/SystemHealth";
import CrowdControl from "../components/CrowdControl";
import LogsTable from "../components/LogsTable";
import ChartCrowdHistory from "../components/ChartCrowdHistory";
import ChartCrowdForecast from "../components/ChartCrowdForecast";
import AuthenticationPanel from "../components/AuthenticationPanel";
import AlertLogTable from "../components/AlertLogTable";
import AlertNotification from "../components/AlertNotification";
import CrowdCountDisplay from "../components/CrowdCountDisplay";
import FileSelector from "../components/FileSelector";
import DataViewer from "../components/DataViewer";
import CrowdAnalytics from "../components/CrowdAnalytics";
import AlertCenter from "../components/AlertCenter";
import SystemSettings from "../components/SystemSettings";
import webSocketService from "../services/webSocketService";

import { authAPI, diagnostic } from "../utils/api";
import api, {
  crowdAPI,
  alertAPI,
  actionAPI,
  resultAPI,
  fetchCrowdHistory,
  fetchCrowdForecast,
  getSystemStatus,
} from "../utils/api";
import { downloadFile } from "../utils/download";

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Navigation state
  const [activeSection, setActiveSection] = useState("Dashboard Overview");

  // Live data states
  const [currentView, setCurrentView] = useState("detection"); // "detection" or "forecast"
  const [liveDetectionData, setLiveDetectionData] = useState(null);
  const [liveForecastData, setLiveForecastData] = useState(null);

  const [systemHealth, setSystemHealth] = useState([
    { name: "Detection Model", status: "unknown" },
    { name: "Forecasting Model", status: "unknown" },
    { name: "Alert Service", status: "unknown" },
    { name: "File Watcher", status: "active" },
  ]);

  const [actionsLog, setActionsLog] = useState([]);
  const [logs, setLogs] = useState([]);
  const [peopleCount, setPeopleCount] = useState(0);
  const [crowdHistory, setCrowdHistory] = useState([]);
  const [crowdForecast, setCrowdForecast] = useState([]);
  const [alert, setAlert] = useState("");
  const [popupAlert, setPopupAlert] = useState(false);
  const [alertLog, setAlertLog] = useState([]);

  // File-based data states
  const [selectedFile, setSelectedFile] = useState(null);

  // Render functions for different sections
  const renderDashboardOverview = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Live Crowd Management System
              </Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant={
                    currentView === "detection" ? "contained" : "outlined"
                  }
                  onClick={() => setCurrentView("detection")}
                >
                  Live Detection
                </Button>
                <Button
                  variant={
                    currentView === "forecast" ? "contained" : "outlined"
                  }
                  onClick={() => setCurrentView("forecast")}
                >
                  Live Forecast
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <CrowdCountDisplay
              count={peopleCount}
              lastUpdated={liveDetectionData?.lastUpdated}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <SystemHealth health={systemHealth} />
          </CardContent>
        </Card>
      </Grid>

      {currentView === "forecast" && liveForecastData && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Live Forecast Predictions
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                {Array.isArray(crowdForecast) &&
                  crowdForecast.slice(0, 10).map((prediction, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor:
                          prediction.zone === "danger"
                            ? "error.light"
                            : prediction.zone === "warning"
                            ? "warning.light"
                            : "success.light",
                        color:
                          prediction.zone === "danger"
                            ? "error.dark"
                            : prediction.zone === "warning"
                            ? "warning.dark"
                            : "success.dark",
                        minWidth: 120,
                        textAlign: "center",
                      }}
                    >
                      <Typography variant="h6">
                        {Math.round(prediction.count)}
                      </Typography>
                      <Typography variant="body2">
                        Step {prediction.in}
                      </Typography>
                    </Box>
                  ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}

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

      <Grid item xs={12} lg={4}>
        <FileSelector
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
        />
      </Grid>

      <Grid item xs={12} lg={8}>
        <DataViewer selectedFile={selectedFile} />
      </Grid>

      {currentView === "detection" && (
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <ChartCrowdHistory chartData={chartData} />
            </CardContent>
          </Card>
        </Grid>
      )}

      {currentView === "forecast" && (
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <ChartCrowdForecast chartData={forecastChartData} alert={alert} />
            </CardContent>
          </Card>
        </Grid>
      )}

      <Grid item xs={12} lg={6}>
        <Card>
          <CardContent>
            <AlertLogTable alertLog={alertLog} />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} lg={6}>
        <Card>
          <CardContent>
            <LogsTable logs={filteredLogs} onDownload={downloadLogs} />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "Crowd Analytics":
        return <CrowdAnalytics />;
      case "Alert Center":
        return <AlertCenter />;
      case "System Settings":
        return <SystemSettings />;
      default:
        return renderDashboardOverview();
    }
  };

  // Load live detection data from latest files
  const loadLiveDetectionData = async () => {
    try {
      const latestDetection = await resultAPI.getLatest("detection");

      if (latestDetection && latestDetection.success && latestDetection.data) {
        const detectionData = latestDetection.data;

        setLiveDetectionData({
          data: detectionData,
          lastUpdated: new Date(),
        });

        const latestEntry = Array.isArray(detectionData)
          ? detectionData[detectionData.length - 1]
          : detectionData;

        if (latestEntry) {
          setPeopleCount(latestEntry.count || 0);

          if (latestEntry.alert) {
            setPopupAlert(true);
            setAlertLog((prev) => [
              {
                time: new Date(latestEntry.timestamp).toLocaleTimeString(),
                count: latestEntry.count,
                type: "Live Detection Alert",
              },
              ...prev.slice(0, 19),
            ]);
          } else {
            setPopupAlert(false);
          }
        }

        if (Array.isArray(detectionData)) {
          setCrowdHistory(
            detectionData.slice(-15).map((item) => ({
              time: new Date(item.timestamp).toLocaleTimeString(),
              count: item.count,
            }))
          );
        }
      }
    } catch (error) {
      console.warn("Error loading live detection data:", error);
      setPeopleCount(18);
      setLiveDetectionData({
        filename: "demo_detections.json",
        data: [
          { timestamp: new Date().toISOString(), count: 18, alert: false },
        ],
        lastUpdated: new Date(),
      });
    }
  };

  // Load live forecast data from latest files
  const loadLiveForecastData = async () => {
    try {
      const latestForecast = await resultAPI.getLatest("forecast");

      if (latestForecast && latestForecast.success && latestForecast.data) {
        const forecastData = latestForecast.data;

        setLiveForecastData({
          data: forecastData,
          lastUpdated: new Date(),
        });

        let forecastArray = [];
        if (
          forecastData.lstm_predictions &&
          Array.isArray(forecastData.lstm_predictions)
        ) {
          forecastArray = forecastData.lstm_predictions.map((count, index) => ({
            in: index + 1,
            count: Math.round(count * 100) / 100,
            zone: count > 200 ? "danger" : count > 100 ? "warning" : "safe",
          }));
        } else if (
          forecastData.linear_predictions &&
          Array.isArray(forecastData.linear_predictions)
        ) {
          forecastArray = forecastData.linear_predictions.map(
            (count, index) => ({
              in: index + 1,
              count: Math.round(count * 100) / 100,
              zone: count > 200 ? "danger" : count > 100 ? "warning" : "safe",
            })
          );
        }

        setCrowdForecast(forecastArray);

        const dangerPrediction = forecastArray.find(
          (item) => item.zone === "danger"
        );
        if (dangerPrediction) {
          const alertMessage = `⚠ Predicted overcrowding in ${dangerPrediction.in} step(s).`;
          setAlert(alertMessage);
        } else {
          setAlert("");
        }
      }
    } catch (error) {
      console.warn("Error loading live forecast data:", error);
      setLiveForecastData({
        filename: "demo_forecast.json",
        data: [{ in: 5, count: 20, zone: "safe" }],
        lastUpdated: new Date(),
      });
    }
  };

  const loadSystemStatus = async () => {
    try {
      const statusResponse = await getSystemStatus();

      if (statusResponse && statusResponse.success && statusResponse.services) {
        setSystemHealth(statusResponse.services);
      }
    } catch (error) {
      console.warn("Error loading system status:", error);
      // Keep default status if API fails
    }
  };

  // Setup WebSocket listeners for real-time updates
  const setupWebSocketListeners = () => {
    webSocketService.on("fileUpdate", (event) => {
      console.log("Real-time file update received:", event);

      if (event.type === "detection") {
        loadLiveDetectionData();
      } else if (event.type === "forecast") {
        loadLiveForecastData();
      }
    });

    webSocketService.on("latestDetection", (data) => {
      console.log("Latest detection update received");
      if (data) {
        setPeopleCount(data.count || 0);
      }
    });
  };

  const handleLoginSuccess = (profile) => {
    setUserProfile(profile);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setUserProfile(null);
    setIsAuthenticated(false);
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  // Chart data preparation
  const chartData = {
    labels: crowdHistory.map((item) => item.time),
    datasets: [
      {
        label: "People Count",
        data: crowdHistory.map((item) => item.count),
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.1,
      },
    ],
  };

  const forecastChartData = {
    labels: crowdForecast.map((item) => `+${item.in}m`),
    datasets: [
      {
        label: "Forecast",
        data: crowdForecast.map((item) => item.count),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        tension: 0.1,
      },
    ],
  };

  // Filter logs for display
  const filteredLogs = logs.filter((log) =>
    ["action", "alert", "prediction"].includes(log.type)
  );

  const downloadLogs = () => {
    const logData = logs.map((log) => ({
      time: log.time,
      type: log.type,
      value: log.value,
    }));
    downloadFile(logData, "crowd-management-logs.json");
  };

  const handleRedirectCrowd = async () => {
    const actionDetails = {
      time: new Date().toLocaleTimeString(),
      action: "Redirect Crowd",
      details: "Crowd redirection initiated based on live detection data",
    };
    try {
      await actionAPI.recordAction({
        action: "redirect_crowd",
        cameraId: "live_detection",
        details: actionDetails.details,
        timestamp: new Date().toISOString(),
        performedBy: "demo_user_id",
        performedByUsername: userProfile?.name || "Demo User",
      });
      setActionsLog((prev) => [actionDetails, ...prev]);
      setLogs((prev) => [
        {
          time: actionDetails.time,
          type: "action",
          value: actionDetails.action,
        },
        ...prev.slice(0, 19),
      ]);
      window.alert("Redirect Crowd action triggered! (Note: Legacy system)");
    } catch (err) {
      console.error("Failed to record action:", err);
      window.alert("Redirect Crowd action triggered! (Note: Legacy system)");
    }
  };

  const handleRequestPolice = async () => {
    const actionDetails = {
      time: new Date().toLocaleTimeString(),
      action: "Request Police/Staff",
      details: "Emergency request sent based on live detection data",
    };
    try {
      await actionAPI.recordAction({
        action: "request_police",
        cameraId: "live_detection",
        details: actionDetails.details,
        timestamp: new Date().toISOString(),
        performedBy: "demo_user_id",
        performedByUsername: userProfile?.name || "Demo User",
      });
      setActionsLog((prev) => [actionDetails, ...prev]);
      setLogs((prev) => [
        {
          time: actionDetails.time,
          type: "action",
          value: actionDetails.action,
        },
        ...prev.slice(0, 19),
      ]);
      window.alert("Request Police/Staff action triggered!");
    } catch (err) {
      console.error("Failed to record action:", err);
      window.alert("Request Police/Staff action triggered!");
    }
  };

  // Component lifecycle
  useEffect(() => {
    // Demo mode - no authentication required
    setIsAuthenticated(true);
    setUserProfile({
      name: "Demo User",
      role: "Administrator",
      email: "demo@crowdmanagement.com",
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadLiveDetectionData();
      loadLiveForecastData();
      loadSystemStatus();
      setupWebSocketListeners();

      const interval = setInterval(() => {
        loadLiveDetectionData();
        loadLiveForecastData();
        loadSystemStatus();
      }, 30000);

      return () => {
        clearInterval(interval);
        webSocketService.off("fileUpdate");
        webSocketService.off("latestDetection");
      };
    }
  }, [isAuthenticated]);

  return (
    <>
      <AuthenticationPanel
        isAuthenticated={isAuthenticated}
        isLoading={isAuthenticated === null}
        userProfile={userProfile}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />

      {isAuthenticated && (
        <DashboardLayout
          userProfile={userProfile}
          onLogout={handleLogout}
          isAuthenticated={isAuthenticated}
          activeSection={activeSection}
          onNavigationChange={setActiveSection}
        >
          <AlertNotification show={popupAlert} peopleCount={peopleCount} />

          {renderContent()}
        </DashboardLayout>
      )}
    </>
  );
}
