import React, { useEffect, useState } from "react";
import { Grid, Card, CardContent, Box, Typography, Button } from "@mui/material";
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
  // Only keep important logs: 'action', 'alert', 'prediction'
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
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Live Crowd Management System
              </Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant={currentView === "detection" ? "contained" : "outlined"}
                  onClick={() => setCurrentView("detection")}
                >
                  Live Detection
                </Button>
                <Button
                  variant={currentView === "forecast" ? "contained" : "outlined"}
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
                {Array.isArray(crowdForecast) && crowdForecast.slice(0, 10).map((prediction, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: prediction.zone === "danger" ? "error.light" 
                        : prediction.zone === "warning" ? "warning.light" 
                        : "success.light",
                      color: prediction.zone === "danger" ? "error.dark" 
                        : prediction.zone === "warning" ? "warning.dark" 
                        : "success.dark",
                      minWidth: 120,
                      textAlign: "center",
                    }}
                  >
                    <Typography variant="h6">{Math.round(prediction.count)}</Typography>
                    <Typography variant="body2">Step {prediction.in}</Typography>
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
              <ChartCrowdForecast
                chartData={forecastChartData}
                alert={alert}
              />
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
      // Get the latest detection file
      const latestDetection = await resultAPI.getLatest("detection");

      if (latestDetection && latestDetection.success && latestDetection.data) {
        const detectionData = latestDetection.data;

        setLiveDetectionData({
          data: detectionData,
          lastUpdated: new Date(),
        });

        // Extract latest people count for display
        const latestEntry = Array.isArray(detectionData)
          ? detectionData[detectionData.length - 1]
          : detectionData;

        if (latestEntry) {
          setPeopleCount(latestEntry.count || 0);

          // Set alert if needed
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

        // Update crowd history for charts
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
      // Fallback to demo data
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
      // Get the latest forecast file
      const latestForecast = await resultAPI.getLatest("forecast");

      if (latestForecast && latestForecast.success && latestForecast.data) {
        const forecastData = latestForecast.data;

        setLiveForecastData({
          data: forecastData,
          lastUpdated: new Date(),
        });

        // Handle LSTM predictions from API (as used in fetchCrowdForecast)
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

        // Check for forecast alerts
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
      // Fallback to demo data
      setLiveForecastData({
        filename: "demo_forecast.json",
        data: [{ in: 5, count: 20, zone: "safe" }],
        lastUpdated: new Date(),
      });
    }
  };

  // Load crowd levels for all locations

  // Setup WebSocket listeners for real-time updates
  const setupWebSocketListeners = () => {
    // Listen for file updates
    webSocketService.on("fileUpdate", (event) => {
      console.log("Real-time file update received:", event);

      // Refresh live data when new files are detected
      if (event.type === "detection") {
        loadLiveDetectionData();
      } else if (event.type === "forecast") {
        loadLiveForecastData();
      }
    });

    // Listen for latest detection updates
    webSocketService.on("latestDetection", (data) => {
      console.log("Latest detection update received");
      if (data) {
        // Update people count and add to crowd history
        setPeopleCount(data.count || 0);
        setCrowdHistory((prev) => [
          ...prev.slice(-14), // Keep last 14 entries
          {
            time: new Date().toLocaleTimeString(),
            count: data.count || 0,
            zone: data.zone || "safe",
          },
        ]);
      }
    });

    // Listen for latest forecast updates
    webSocketService.on("latestForecast", (data) => {
      console.log("Latest forecast update received");
      if (data && data.forecast) {
        setCrowdForecast(data.forecast);
      }
    });

    // Listen for connection status
    webSocketService.on("connected", () => {
      console.log("WebSocket connected - enabling real-time updates");
      // Update system health
      setSystemHealth((prev) =>
        prev.map((item) =>
          item.name === "File Watcher" ? { ...item, status: "active" } : item
        )
      );
    });

    webSocketService.on("disconnected", () => {
      console.log("WebSocket disconnected - falling back to polling");
      // Update system health
      setSystemHealth((prev) =>
        prev.map((item) =>
          item.name === "File Watcher" ? { ...item, status: "warning" } : item
        )
      );
    });
  };

  // Authentication check (temporarily bypassed for development)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authResult = await diagnostic.checkAuth();
        if (authResult.authenticated) {
          const profile = await authAPI.getProfile();
          setUserProfile(profile.data || { name: "User" });
          setIsAuthenticated(true);
        } else {
          // Temporarily bypass authentication for development
          console.warn(
            "Authentication bypassed for development - using demo user"
          );
          setUserProfile({ name: "Demo User" });
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Auth check error:", err);
        // Temporarily bypass authentication for development
        console.warn(
          "Authentication bypassed due to backend connection issues"
        );
        setUserProfile({ name: "Demo User" });
        setIsAuthenticated(true);
      }
    };
    checkAuth();
  }, []);

  // Load live data and setup WebSocket
  useEffect(() => {
    if (isAuthenticated) {
      // Load both detection and forecast data initially
      loadLiveDetectionData();
      loadLiveForecastData();

      // Connect to WebSocket if not already connected
      const token = localStorage.getItem("authToken");
      if (token && !webSocketService.isSocketConnected()) {
        webSocketService.connect(token);
        setupWebSocketListeners();
      }
    } else {
      // Disconnect WebSocket when not authenticated
      webSocketService.disconnect();
    }

    // Cleanup on unmount
    return () => {
      webSocketService.disconnect();
    };
  }, [isAuthenticated]);

  // Auto-refresh live data based on current view
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(() => {
      // Always keep both detection and forecast data fresh
      loadLiveDetectionData();
      loadLiveForecastData();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated]);

  const handleLoginSuccess = (profile) => {
    setIsAuthenticated(true);
    setUserProfile(profile.data || { name: "User" });

    // Connect to WebSocket after successful authentication
    const token = localStorage.getItem("authToken"); // Use consistent token key
    if (token) {
      webSocketService.connect(token);
      setupWebSocketListeners();
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    webSocketService.disconnect();
    setIsAuthenticated(false);
    setUserProfile(null);
  };

  // Handle file selection for data viewing
  const handleFileSelect = (file) => {
    setSelectedFile(file);
    console.log("Selected file for viewing:", file);
  };

  // NOTE: Camera fetching removed - using file-based system now
  // Legacy simulation for demonstration purposes

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

  const handleRedirectCrowd = async () => {
    const actionDetails = {
      time: new Date().toLocaleTimeString(),
      action: "Redirect Crowd",
      details: "Extra gates/signboards triggered based on live detection data",
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
      window.alert("Redirect Crowd action triggered!");
    } catch (err) {
      console.error("Failed to record action:", err);
      setActionsLog((prev) => [actionDetails, ...prev]);
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
      setActionsLog((prev) => [actionDetails, ...prev]);
      window.alert(
        "Request Police/Staff action triggered! (Note: Legacy system)"
      );
    }
  };

  // Helper to filter logs before rendering or download
  const importantLogTypes = ["action", "alert", "prediction"];
  const filteredLogs = logs.filter((log) =>
    importantLogTypes.includes(log.type)
  );

  const downloadLogs = (format) => {
    downloadFile(filteredLogs, format, "logs");
  };

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

// temp placeholder
const temp = () => (
  <div>
    <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Live Data View
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <Box
                      onClick={() => setCurrentView("detection")}
                      sx={{
                        p: 2,
                        border: 1,
                        borderColor:
                          currentView === "detection"
                            ? "primary.main"
                            : "grey.300",
                        borderRadius: 1,
                        cursor: "pointer",
                        bgcolor:
                          currentView === "detection"
                            ? "primary.light"
                            : "background.paper",
                        "&:hover": { bgcolor: "grey.100" },
                        minWidth: 120,
                        textAlign: "center",
                      }}
                    >
                      <Typography variant="body2" fontWeight="bold">
                        Detection
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Live crowd detection
                      </Typography>
                    </Box>
                    <Box
                      onClick={() => setCurrentView("forecast")}
                      sx={{
                        p: 2,
                        border: 1,
                        borderColor:
                          currentView === "forecast"
                            ? "secondary.main"
                            : "grey.300",
                        borderRadius: 1,
                        cursor: "pointer",
                        bgcolor:
                          currentView === "forecast"
                            ? "secondary.light"
                            : "background.paper",
                        "&:hover": { bgcolor: "grey.100" },
                        minWidth: 120,
                        textAlign: "center",
                      }}
                    >
                      <Typography variant="body2" fontWeight="bold">
                        Forecast
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Crowd predictions
                      </Typography>
                    </Box>
                  </Box>

                  {/* Live Data Display */}
                  <Box
                    sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Current View:{" "}
                      <strong>
                        {currentView === "detection"
                          ? "Live Detection"
                          : "Live Forecast"}
                      </strong>
                    </Typography>
                    {currentView === "detection" && liveDetectionData && (
                      <Typography variant="caption" color="text.secondary">
                        Source: {liveDetectionData.filename} • Updated:{" "}
                        {liveDetectionData.lastUpdated.toLocaleTimeString()}
                      </Typography>
                    )}
                    {currentView === "forecast" && liveForecastData && (
                      <Typography variant="caption" color="text.secondary">
                        Source: {liveForecastData.filename} • Updated:{" "}
                        {liveForecastData.lastUpdated.toLocaleTimeString()}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <CrowdCountDisplay peopleCount={peopleCount} />
            </Grid>

            {currentView === "forecast" && crowdForecast.length > 0 && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Next Predictions
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {crowdForecast.slice(0, 4).map((prediction, index) => (
                        <Box
                          key={index}
                          sx={{
                            p: 1,
                            border: 1,
                            borderColor:
                              prediction.zone === "danger"
                                ? "error.main"
                                : prediction.zone === "warning"
                                ? "warning.main"
                                : "success.main",
                            borderRadius: 1,
                            minWidth: 80,
                            textAlign: "center",
                            bgcolor:
                              prediction.zone === "danger"
                                ? "error.light"
                                : prediction.zone === "warning"
                                ? "warning.light"
                                : "success.light",
                          }}
                        >
                          <Typography variant="caption" display="block">
                            +{prediction.in} min
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {Math.round(prediction.count)}
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

            {/* File-Based Data Section */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Real-time Analysis Files
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Select detection or forecast files from the results folder
                    to view real-time data
                  </Typography>
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

            {/* Legacy Charts Section */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Legacy Dashboard Data
                  </Typography>
                </CardContent>
              </Card>
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
                    <ChartCrowdForecast
                      chartData={forecastChartData}
                      alert={alert}
                    />
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
        </DashboardLayout>
      )}
    </>
  );
}
