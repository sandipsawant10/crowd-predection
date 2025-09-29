import React, { useEffect, useState } from "react";
import { Grid, Card, CardContent, Box } from "@mui/material";
import DashboardLayout from "../components/DashboardLayout";
import SystemHealth from "../components/SystemHealth";
import CrowdControl from "../components/CrowdControl";
import LogsTable from "../components/LogsTable";
import ChartCrowdHistory from "../components/ChartCrowdHistory";
import ChartCrowdForecast from "../components/ChartCrowdForecast";
import CameraSelector from "../components/CameraSelector";
import AuthenticationPanel from "../components/AuthenticationPanel";
import LocationMapView from "../components/LocationMapView";
import AlertLogTable from "../components/AlertLogTable";
import AlertNotification from "../components/AlertNotification";
import CrowdCountDisplay from "../components/CrowdCountDisplay";

import { authAPI, diagnostic } from "../utils/api";
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

const CAMERA_LOCATIONS = [
  { id: "gate1", name: "Station Gate 1", x: 50, y: 80 },
  { id: "platform3", name: "Platform 3", x: 200, y: 120 },
  { id: "exit", name: "Exit Gate", x: 350, y: 60 },
];

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const [cameraLocations, setCameraLocations] = useState([]);
  const [systemHealth, setSystemHealth] = useState([
    { name: "Detection Model", status: "unknown" },
    { name: "Forecasting Model", status: "unknown" },
    { name: "Alert Service", status: "unknown" },
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

  const [selectedCamera, setSelectedCamera] = useState(CAMERA_LOCATIONS[0].id);
  const [locationCrowdLevels, setLocationCrowdLevels] = useState({
    gate1: { count: 80, zone: "safe" },
    platform3: { count: 130, zone: "danger" },
    exit: { count: 100, zone: "warning" },
  });

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authResult = await diagnostic.checkAuth();
        if (authResult.authenticated) {
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

  const handleLoginSuccess = (profile) => {
    setIsAuthenticated(true);
    setUserProfile(profile.data || { name: "User" });
  };

  const handleLogout = () => {
    authAPI.logout();
    setIsAuthenticated(false);
    setUserProfile(null);
  };

  // Fetch cameras
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCameras = async () => {
      try {
        const response = await cameraAPI.getAllCameras();
        if (response.data && response.data.length > 0) {
          const cameras = response.data.map((camera, index) => {
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
          if (!selectedCamera && cameras.length > 0) {
            setSelectedCamera(cameras[0].id);
          }
          const initialLevels = {};
          cameras.forEach((cam) => {
            initialLevels[cam.id] = { count: 0, zone: "safe" };
          });
          setLocationCrowdLevels((prev) => ({ ...initialLevels, ...prev }));
        }
      } catch (err) {
        console.error("Error fetching cameras:", err);
      }
    };
    fetchCameras();
  }, [isAuthenticated, selectedCamera]);

  // People count
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchCount = async () => {
      try {
        const data = await fetchPeopleCount(selectedCamera);
        setPeopleCount(data.count);
        setLocationCrowdLevels((prev) => ({
          ...prev,
          [selectedCamera]: { count: data.count, zone: data.zone },
        }));
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
  }, [selectedCamera, isAuthenticated]);

  // Crowd history
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchHistory = async () => {
      try {
        const data = await fetchCrowdHistory(selectedCamera, 15);
        setCrowdHistory(data.history);
      } catch (err) {
        console.error("Error fetching crowd history:", err);
        setCrowdHistory([]);
      }
    };
    fetchHistory();
    const interval = setInterval(fetchHistory, 10000);
    return () => clearInterval(interval);
  }, [selectedCamera, isAuthenticated]);

  // Crowd forecast
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchForecast = async () => {
      try {
        const data = await fetchCrowdForecast(selectedCamera);
        setCrowdForecast(data.forecast);
        const danger = data.forecast.find((item) => item.zone === "danger");
        if (danger) {
          const alertMessage = `⚠ Predicted overcrowding in ${danger.in} mins.`;
          setAlert(alertMessage);
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
        console.error("Error fetching crowd forecast:", err);
        setCrowdForecast([]);
        setAlert("");
      }
    };
    fetchForecast();
    const interval = setInterval(fetchForecast, 10000);
    return () => clearInterval(interval);
  }, [selectedCamera, isAuthenticated]);

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
      details: `Extra gates/signboards triggered for ${selectedCamera}`,
    };
    try {
      await actionAPI.recordAction({
        cameraId: selectedCamera,
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
      await actionAPI.recordAction({
        cameraId: selectedCamera,
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
      alert(
        "Request Police/Staff action triggered! (Note: Server sync failed)"
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
        >
          <AlertNotification show={popupAlert} peopleCount={peopleCount} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <CameraSelector
                    locations={cameraLocations}
                    selected={selectedCamera}
                    onChange={setSelectedCamera}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <CrowdCountDisplay peopleCount={peopleCount} />
            </Grid>

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
