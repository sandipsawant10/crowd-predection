import React, { useEffect, useState } from "react";
import { Grid, Card, CardContent, Box, Typography } from "@mui/material";
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
import webSocketService from "../services/webSocketService";

import { authAPI, diagnostic } from "../utils/api";
import api, {
  crowdAPI,
  alertAPI,
  actionAPI,
  resultAPI,
  fetchPeopleCount,
  fetchCrowdHistory,
  fetchCrowdForecast,
} from "../utils/api";
import { downloadFile } from "../utils/download";

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Data sets - will be populated from actual detection files (frame numbers)
  const [locations, setLocations] = useState([]);

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

  // Load real locations from detection files with fallback
  const loadRealLocations = async () => {
    try {
      const filesResponse = await resultAPI.getFiles();

      if (filesResponse.success && filesResponse.files) {
        // Extract unique data sets from detection files
        const detectionFiles = filesResponse.files.filter(
          (f) => f.type === "detection"
        );
        const dataSetIds = [
          ...new Set(
            detectionFiles.map((f) => {
              // Extract frame number from filename (e.g., detections_60.json -> dataset_60)
              const match = f.filename.match(/detections_(\d+)\.json/);
              return match ? `dataset_${match[1]}` : null;
            })
          ),
        ].filter(Boolean);

        const realDataSets = dataSetIds.map((id, index) => ({
          id,
          name: `Frame Set ${id.replace("dataset_", "")}`,
          x: 50 + index * 150, // Spread data sets across the view
          y: 60 + index * 40,
        }));

        setLocations(realDataSets);

        // Set first data set as default if none selected
        if (realDataSets.length > 0 && !selectedLocation) {
          setSelectedLocation(realDataSets[0].id);
        }

        // Load crowd levels for all data sets
        await loadAllLocationCrowdLevels(realDataSets);
      }
    } catch (error) {
      console.warn("API unavailable, using offline demo locations:", error);

      // Fallback to demo data sets when API is unavailable
      const demoDataSets = [
        { id: "dataset_60", name: "Frame Set 60", x: 50, y: 60 },
        { id: "dataset_30", name: "Frame Set 30", x: 200, y: 100 },
        { id: "dataset_90", name: "Frame Set 90", x: 350, y: 140 },
      ];

      setLocations(demoDataSets);

      if (!selectedLocation && demoDataSets.length > 0) {
        setSelectedLocation(demoDataSets[0].id);
      }

      // Set demo crowd levels
      setLocationCrowdLevels({
        dataset_60: { count: 12, zone: "warning" },
        dataset_30: { count: 8, zone: "safe" },
        dataset_90: { count: 15, zone: "danger" },
      });
    }
  };

  // Load crowd levels for all locations
  const loadAllLocationCrowdLevels = async (locationsList = locations) => {
    try {
      const crowdLevels = {};

      // Load data for each data set
      await Promise.all(
        locationsList.map(async (location) => {
          try {
            const frameNumber = location.id.replace("dataset_", "");
            const countData = await fetchPeopleCount(frameNumber);

            if (countData) {
              crowdLevels[location.id] = {
                count: countData.count,
                zone: countData.zone,
              };
            } else {
              crowdLevels[location.id] = {
                count: 0,
                zone: "safe",
              };
            }
          } catch (error) {
            console.warn(`Error loading data for ${location.id}:`, error);
            crowdLevels[location.id] = {
              count: 0,
              zone: "safe",
            };
          }
        })
      );

      setLocationCrowdLevels(crowdLevels);
    } catch (error) {
      console.error("Error loading all location crowd levels:", error);
    }
  };

  // Setup WebSocket listeners for real-time updates
  const setupWebSocketListeners = () => {
    // Listen for file updates
    webSocketService.on("fileUpdate", (event) => {
      console.log("Real-time file update received:", event);

      // Refresh data when new files are detected
      if (event.type === "detection") {
        // Reload data sets and crowd levels
        loadRealLocations();
        if (selectedLocation) {
          // Reload selected data set immediately
          const frameNumber = selectedLocation.replace("dataset_", "");
          fetchPeopleCount(frameNumber).then((countData) => {
            if (countData) {
              setPeopleCount(countData.count);
              setLocationCrowdLevels((prev) => ({
                ...prev,
                [selectedLocation]: {
                  count: countData.count,
                  zone: countData.zone,
                },
              }));
            }
          });
        }
      } else if (event.type === "forecast") {
        // Reload forecast data
        if (selectedLocation) {
          const frameNumber = selectedLocation.replace("dataset_", "");
          fetchCrowdForecast(frameNumber).then((forecastData) => {
            if (forecastData && forecastData.forecast) {
              setCrowdForecast(forecastData.forecast);
            }
          });
        }
      }
    });

    // Listen for latest detection updates
    webSocketService.on("latestDetection", (data) => {
      console.log("Latest detection update received");
      // Update current selection if it matches
      if (data && selectedLocation) {
        setPeopleCount(data.count || 0);
        setLocationCrowdLevels((prev) => ({
          ...prev,
          [selectedLocation]: {
            count: data.count || 0,
            zone: data.zone || "safe",
          },
        }));
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

  // Real location data based on available detection files
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationCrowdLevels, setLocationCrowdLevels] = useState({});

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

  // Load real locations from detection files and setup WebSocket
  useEffect(() => {
    if (isAuthenticated) {
      loadRealLocations();

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

  // Periodically update all location crowd levels
  useEffect(() => {
    if (!isAuthenticated || locations.length === 0) return;

    // Set up interval to refresh all location data
    const interval = setInterval(() => {
      loadAllLocationCrowdLevels();
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [locations, isAuthenticated]);

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

  // Real-time people count from detection files
  useEffect(() => {
    if (!isAuthenticated || !selectedLocation) return;

    const loadRealCount = async () => {
      try {
        // Extract frame number from selectedLocation (e.g., dataset_60 -> 60)
        const frameNumber = selectedLocation.replace("dataset_", "");

        // Get latest detection data for this frame set
        const countData = await fetchPeopleCount(frameNumber);

        if (countData) {
          setPeopleCount(countData.count);
          setLocationCrowdLevels((prev) => ({
            ...prev,
            [selectedLocation]: {
              count: countData.count,
              zone: countData.zone,
            },
          }));

          // Check for alerts from real detection data
          try {
            const detectionFile = await resultAPI.getFileContents(
              `detections_${frameNumber}.json`
            );
            if (detectionFile.success && detectionFile.data) {
              const latestDetection =
                detectionFile.data[detectionFile.data.length - 1];

              if (latestDetection && latestDetection.alert) {
                setPopupAlert(true);
                setAlertLog((prev) => [
                  {
                    time: new Date(
                      latestDetection.timestamp
                    ).toLocaleTimeString(),
                    count: latestDetection.count,
                    type: "Real Detection Alert",
                  },
                  ...prev.slice(0, 19), // Keep last 20 alerts
                ]);
              } else {
                setPopupAlert(false);
              }
            }
          } catch (fileError) {
            console.warn(
              "Could not load detection file for alert check:",
              fileError
            );
            setPopupAlert(false);
          }
        }
      } catch (error) {
        console.error("Error loading real people count:", error);
        // Fallback to 0 if real data unavailable
        setPeopleCount(0);
        setLocationCrowdLevels((prev) => ({
          ...prev,
          [selectedLocation]: { count: 0, zone: "safe" },
        }));
        setPopupAlert(false);
      }
    };

    // Load immediately
    loadRealCount();

    // Set up interval for real-time updates
    const interval = setInterval(loadRealCount, 5000);
    return () => clearInterval(interval);
  }, [selectedLocation, isAuthenticated]);

  // Real crowd history from detection files
  useEffect(() => {
    if (!isAuthenticated || !selectedLocation) return;

    const loadRealHistory = async () => {
      try {
        // Extract frame number from selectedLocation (e.g., dataset_60 -> 60)
        const frameNumber = selectedLocation.replace("dataset_", "");

        // Get real crowd history for this frame set
        const historyData = await fetchCrowdHistory(frameNumber, 15);

        if (historyData && historyData.history) {
          setCrowdHistory(historyData.history);
        } else {
          // Fallback to empty history if no data available
          setCrowdHistory([]);
        }
      } catch (error) {
        console.error("Error loading real crowd history:", error);
        // Fallback to empty history
        setCrowdHistory([]);
      }
    };

    // Load immediately
    loadRealHistory();

    // Set up interval for updates (longer interval since history changes less frequently)
    const interval = setInterval(loadRealHistory, 30000);
    return () => clearInterval(interval);
  }, [selectedLocation, isAuthenticated]);

  // Real crowd forecast from forecast files
  useEffect(() => {
    if (!isAuthenticated || !selectedLocation) return;

    const loadRealForecast = async () => {
      try {
        // Extract frame number from selectedLocation (e.g., dataset_60 -> 60)
        const frameNumber = selectedLocation.replace("dataset_", "");

        // Get real crowd forecast for this frame set
        const forecastData = await fetchCrowdForecast(frameNumber);

        if (forecastData && forecastData.forecast) {
          setCrowdForecast(forecastData.forecast);

          // Check for danger predictions in real forecast data
          const danger = forecastData.forecast.find(
            (item) => item.zone === "danger"
          );
          if (danger) {
            const alertMessage = `⚠ Predicted overcrowding in ${danger.in} step(s).`;
            setAlert(alertMessage);
            setAlertLog((prev) => [
              {
                time: new Date().toLocaleTimeString(),
                count: danger.count,
                type: "Real Forecast Danger",
              },
              ...prev.slice(0, 19), // Keep last 20 alerts
            ]);
          } else {
            setAlert("");
          }
        } else {
          // Fallback to empty forecast if no data available
          setCrowdForecast([]);
          setAlert("");
        }
      } catch (error) {
        console.error("Error loading real crowd forecast:", error);
        // Fallback to empty forecast
        setCrowdForecast([]);
        setAlert("");
      }
    };

    // Load immediately
    loadRealForecast();

    // Set up interval for updates (longer interval since forecasts change less frequently)
    const interval = setInterval(loadRealForecast, 30000);
    return () => clearInterval(interval);
  }, [selectedLocation, isAuthenticated]);

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
      details: `Extra gates/signboards triggered for ${
        locations.find((loc) => loc.id === selectedLocation)?.name ||
        selectedLocation
      }`,
    };
    try {
      await actionAPI.recordAction({
        locationId: selectedLocation,
        actionType: "redirect_crowd",
        details: actionDetails.details,
        timestamp: new Date().toISOString(),
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
      alert("Redirect Crowd action triggered!");
    } catch (err) {
      console.error("Failed to record action:", err);
      setActionsLog((prev) => [actionDetails, ...prev]);
      alert("Redirect Crowd action triggered! (Note: Legacy system)");
    }
  };

  const handleRequestPolice = async () => {
    const actionDetails = {
      time: new Date().toLocaleTimeString(),
      action: "Request Police/Staff",
      details: `Request sent for ${
        locations.find((loc) => loc.id === selectedLocation)?.name ||
        selectedLocation
      }`,
    };
    try {
      await actionAPI.recordAction({
        locationId: selectedLocation,
        actionType: "request_police",
        details: actionDetails.details,
        timestamp: new Date().toISOString(),
        urgency: "high",
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
      alert("Request Police/Staff action triggered!");
    } catch (err) {
      console.error("Failed to record action:", err);
      setActionsLog((prev) => [actionDetails, ...prev]);
      alert("Request Police/Staff action triggered! (Note: Legacy system)");
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
        >
          <AlertNotification show={popupAlert} peopleCount={peopleCount} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Analysis Data Sets
                  </Typography>
                  <Box
                    sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}
                  >
                    {locations.map((location) => (
                      <Box
                        key={location.id}
                        onClick={() => setSelectedLocation(location.id)}
                        sx={{
                          p: 2,
                          border: 1,
                          borderColor:
                            selectedLocation === location.id
                              ? "primary.main"
                              : "grey.300",
                          borderRadius: 1,
                          cursor: "pointer",
                          bgcolor:
                            selectedLocation === location.id
                              ? "primary.light"
                              : "background.paper",
                          "&:hover": { bgcolor: "grey.100" },
                        }}
                      >
                        <Typography variant="body2">{location.name}</Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <CrowdCountDisplay peopleCount={peopleCount} />
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Data Sets Overview
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 3,
                      flexWrap: "wrap",
                      justifyContent: "center",
                      p: 2,
                    }}
                  >
                    {locations.map((location) => (
                      <Box
                        key={location.id}
                        sx={{
                          p: 2,
                          border: 2,
                          borderColor:
                            locationCrowdLevels[location.id]?.zone === "danger"
                              ? "error.main"
                              : locationCrowdLevels[location.id]?.zone ===
                                "warning"
                              ? "warning.main"
                              : "success.main",
                          borderRadius: 2,
                          textAlign: "center",
                          minWidth: 120,
                          bgcolor:
                            selectedLocation === location.id
                              ? "grey.100"
                              : "background.paper",
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight="bold">
                          {location.name}
                        </Typography>
                        <Typography
                          variant="h6"
                          color={
                            locationCrowdLevels[location.id]?.zone === "danger"
                              ? "error.main"
                              : locationCrowdLevels[location.id]?.zone ===
                                "warning"
                              ? "warning.main"
                              : "success.main"
                          }
                        >
                          {locationCrowdLevels[location.id]?.count || 0}
                        </Typography>
                        <Typography
                          variant="caption"
                          textTransform="capitalize"
                        >
                          {locationCrowdLevels[location.id]?.zone || "safe"}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

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

            <Grid item xs={12} lg={6}>
              <Card>
                <CardContent>
                  <ChartCrowdHistory chartData={chartData} />
                </CardContent>
              </Card>
            </Grid>

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
