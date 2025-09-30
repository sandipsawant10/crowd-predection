import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  Paper,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Chip,
  LinearProgress,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Notifications as NotificationsIcon,
  Computer as SystemIcon,
  Save as SaveIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Backup as BackupIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
} from "@mui/icons-material";

const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState({
    // Detection Settings
    detection: {
      enabled: true,
      frameRate: 30,
      detectionThreshold: 0.5,
      maxDetections: 100,
      enableGPU: true,
      modelPath: "/models/detection_model.py",
      confidenceThreshold: 0.7,
      nmsThreshold: 0.4,
    },
    // Forecast Settings
    forecast: {
      enabled: true,
      predictionWindow: 10,
      updateInterval: 30,
      modelType: "LSTM",
      windowSize: 30,
      confidenceLevel: 0.87,
      enableLinearModel: true,
      forecastHorizon: 60,
    },
    // Alert Settings
    alerts: {
      enabled: true,
      crowdThreshold: 35,
      alertCooldown: 300,
      enableEmailAlerts: true,
      enablePushNotifications: true,
      enableSoundAlerts: true,
      emailRecipients: ["admin@crowdmanagement.com"],
      alertRetentionDays: 30,
    },
    // Data Management
    data: {
      retentionDays: 7,
      autoBackup: true,
      backupInterval: "daily",
      maxFileSize: 100,
      compressionEnabled: true,
      exportFormat: "JSON",
      archiveOldData: true,
    },
    // System Settings
    system: {
      logLevel: "INFO",
      enableDebugMode: false,
      maxConcurrentProcesses: 4,
      memoryLimit: 8192,
      enableCaching: true,
      cacheSize: 1024,
      enableMetrics: true,
      metricsRetention: 24,
    },
    // Security Settings
    security: {
      enableAuthentication: false,
      sessionTimeout: 3600,
      maxLoginAttempts: 5,
      enableTwoFactor: false,
      passwordMinLength: 8,
      enableAuditLog: true,
      allowAnonymousAccess: true,
    },
  });

  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);

  const tabLabels = [
    "Detection & Forecast",
    "Alerts & Notifications",
    "Data Management",
    "System Performance",
    "Security & Access",
    "Backup & Restore",
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    // In a real application, load settings from backend
    // For now, we'll use localStorage to persist settings
    const savedSettings = localStorage.getItem("systemSettings");
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    }
  };

  const handleSettingChange = (category, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
    setUnsavedChanges(true);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Save to localStorage (in real app, save to backend)
      localStorage.setItem("systemSettings", JSON.stringify(settings));

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setUnsavedChanges(false);
      showSnackbar("Settings saved successfully", "success");
    } catch (error) {
      console.error("Failed to save settings:", error);
      showSnackbar("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = () => {
    setConfirmDialogOpen(true);
  };

  const confirmReset = () => {
    // Reset to default settings
    localStorage.removeItem("systemSettings");
    window.location.reload(); // Reload to get default settings
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `crowd-management-settings-${
      new Date().toISOString().split("T")[0]
    }.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const importSettings = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          setSettings(importedSettings);
          setUnsavedChanges(true);
          showSnackbar("Settings imported successfully", "success");
        } catch (error) {
          showSnackbar(
            "Failed to import settings. Invalid file format.",
            "error"
          );
        }
      };
      reader.readAsText(file);
    }
  };

  const renderDetectionForecastTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Detection Settings
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.detection.enabled}
                  onChange={(e) =>
                    handleSettingChange(
                      "detection",
                      "enabled",
                      e.target.checked
                    )
                  }
                />
              }
              label="Enable Detection"
              sx={{ mb: 2 }}
            />

            <TextField
              label="Frame Rate (fps)"
              type="number"
              value={settings.detection.frameRate}
              onChange={(e) =>
                handleSettingChange(
                  "detection",
                  "frameRate",
                  Number(e.target.value)
                )
              }
              fullWidth
              sx={{ mb: 2 }}
            />

            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>
                Detection Threshold: {settings.detection.detectionThreshold}
              </Typography>
              <Slider
                value={settings.detection.detectionThreshold}
                onChange={(e, value) =>
                  handleSettingChange("detection", "detectionThreshold", value)
                }
                min={0.1}
                max={1.0}
                step={0.1}
                marks={[
                  { value: 0.1, label: "0.1" },
                  { value: 0.5, label: "0.5" },
                  { value: 1.0, label: "1.0" },
                ]}
                valueLabelDisplay="auto"
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.detection.enableGPU}
                  onChange={(e) =>
                    handleSettingChange(
                      "detection",
                      "enableGPU",
                      e.target.checked
                    )
                  }
                />
              }
              label="Enable GPU Acceleration"
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Forecast Settings
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.forecast.enabled}
                  onChange={(e) =>
                    handleSettingChange("forecast", "enabled", e.target.checked)
                  }
                />
              }
              label="Enable Forecasting"
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Model Type</InputLabel>
              <Select
                value={settings.forecast.modelType}
                label="Model Type"
                onChange={(e) =>
                  handleSettingChange("forecast", "modelType", e.target.value)
                }
              >
                <MenuItem value="LSTM">LSTM Neural Network</MenuItem>
                <MenuItem value="Linear">Linear Regression</MenuItem>
                <MenuItem value="Hybrid">Hybrid Model</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Prediction Window (minutes)"
              type="number"
              value={settings.forecast.predictionWindow}
              onChange={(e) =>
                handleSettingChange(
                  "forecast",
                  "predictionWindow",
                  Number(e.target.value)
                )
              }
              fullWidth
              sx={{ mb: 2 }}
            />

            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>
                Window Size: {settings.forecast.windowSize}
              </Typography>
              <Slider
                value={settings.forecast.windowSize}
                onChange={(e, value) =>
                  handleSettingChange("forecast", "windowSize", value)
                }
                min={10}
                max={60}
                step={5}
                marks={[
                  { value: 10, label: "10" },
                  { value: 30, label: "30" },
                  { value: 60, label: "60" },
                ]}
                valueLabelDisplay="auto"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderAlertsTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Alert Configuration
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.alerts.enabled}
                  onChange={(e) =>
                    handleSettingChange("alerts", "enabled", e.target.checked)
                  }
                />
              }
              label="Enable Alerts"
              sx={{ mb: 2 }}
            />

            <TextField
              label="Crowd Threshold"
              type="number"
              value={settings.alerts.crowdThreshold}
              onChange={(e) =>
                handleSettingChange(
                  "alerts",
                  "crowdThreshold",
                  Number(e.target.value)
                )
              }
              fullWidth
              sx={{ mb: 2 }}
              helperText="Alert when crowd exceeds this number"
            />

            <TextField
              label="Alert Cooldown (seconds)"
              type="number"
              value={settings.alerts.alertCooldown}
              onChange={(e) =>
                handleSettingChange(
                  "alerts",
                  "alertCooldown",
                  Number(e.target.value)
                )
              }
              fullWidth
              sx={{ mb: 2 }}
              helperText="Minimum time between alerts"
            />

            <TextField
              label="Alert Retention (days)"
              type="number"
              value={settings.alerts.alertRetentionDays}
              onChange={(e) =>
                handleSettingChange(
                  "alerts",
                  "alertRetentionDays",
                  Number(e.target.value)
                )
              }
              fullWidth
              helperText="How long to keep alert history"
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Notification Channels
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.alerts.enableEmailAlerts}
                  onChange={(e) =>
                    handleSettingChange(
                      "alerts",
                      "enableEmailAlerts",
                      e.target.checked
                    )
                  }
                />
              }
              label="Email Notifications"
              sx={{ mb: 2 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.alerts.enablePushNotifications}
                  onChange={(e) =>
                    handleSettingChange(
                      "alerts",
                      "enablePushNotifications",
                      e.target.checked
                    )
                  }
                />
              }
              label="Push Notifications"
              sx={{ mb: 2 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.alerts.enableSoundAlerts}
                  onChange={(e) =>
                    handleSettingChange(
                      "alerts",
                      "enableSoundAlerts",
                      e.target.checked
                    )
                  }
                />
              }
              label="Sound Alerts"
              sx={{ mb: 2 }}
            />

            <TextField
              label="Email Recipients"
              value={settings.alerts.emailRecipients.join(", ")}
              onChange={(e) =>
                handleSettingChange(
                  "alerts",
                  "emailRecipients",
                  e.target.value.split(", ").filter((email) => email.trim())
                )
              }
              fullWidth
              helperText="Comma-separated email addresses"
              multiline
              rows={3}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderDataManagementTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Data Retention
            </Typography>

            <TextField
              label="Data Retention (days)"
              type="number"
              value={settings.data.retentionDays}
              onChange={(e) =>
                handleSettingChange(
                  "data",
                  "retentionDays",
                  Number(e.target.value)
                )
              }
              fullWidth
              sx={{ mb: 2 }}
              helperText="How long to keep detection data"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.data.archiveOldData}
                  onChange={(e) =>
                    handleSettingChange(
                      "data",
                      "archiveOldData",
                      e.target.checked
                    )
                  }
                />
              }
              label="Archive Old Data"
              sx={{ mb: 2 }}
            />

            <TextField
              label="Max File Size (MB)"
              type="number"
              value={settings.data.maxFileSize}
              onChange={(e) =>
                handleSettingChange(
                  "data",
                  "maxFileSize",
                  Number(e.target.value)
                )
              }
              fullWidth
              helperText="Maximum size for data files"
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Backup Settings
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.data.autoBackup}
                  onChange={(e) =>
                    handleSettingChange("data", "autoBackup", e.target.checked)
                  }
                />
              }
              label="Enable Auto Backup"
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Backup Interval</InputLabel>
              <Select
                value={settings.data.backupInterval}
                label="Backup Interval"
                onChange={(e) =>
                  handleSettingChange("data", "backupInterval", e.target.value)
                }
              >
                <MenuItem value="hourly">Every Hour</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.data.compressionEnabled}
                  onChange={(e) =>
                    handleSettingChange(
                      "data",
                      "compressionEnabled",
                      e.target.checked
                    )
                  }
                />
              }
              label="Enable Compression"
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth>
              <InputLabel>Export Format</InputLabel>
              <Select
                value={settings.data.exportFormat}
                label="Export Format"
                onChange={(e) =>
                  handleSettingChange("data", "exportFormat", e.target.value)
                }
              >
                <MenuItem value="JSON">JSON</MenuItem>
                <MenuItem value="CSV">CSV</MenuItem>
                <MenuItem value="XML">XML</MenuItem>
              </Select>
            </FormControl>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderSystemTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Performance
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Log Level</InputLabel>
              <Select
                value={settings.system.logLevel}
                label="Log Level"
                onChange={(e) =>
                  handleSettingChange("system", "logLevel", e.target.value)
                }
              >
                <MenuItem value="DEBUG">Debug</MenuItem>
                <MenuItem value="INFO">Info</MenuItem>
                <MenuItem value="WARNING">Warning</MenuItem>
                <MenuItem value="ERROR">Error</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.system.enableDebugMode}
                  onChange={(e) =>
                    handleSettingChange(
                      "system",
                      "enableDebugMode",
                      e.target.checked
                    )
                  }
                />
              }
              label="Enable Debug Mode"
              sx={{ mb: 2 }}
            />

            <TextField
              label="Max Concurrent Processes"
              type="number"
              value={settings.system.maxConcurrentProcesses}
              onChange={(e) =>
                handleSettingChange(
                  "system",
                  "maxConcurrentProcesses",
                  Number(e.target.value)
                )
              }
              fullWidth
              sx={{ mb: 2 }}
            />

            <TextField
              label="Memory Limit (MB)"
              type="number"
              value={settings.system.memoryLimit}
              onChange={(e) =>
                handleSettingChange(
                  "system",
                  "memoryLimit",
                  Number(e.target.value)
                )
              }
              fullWidth
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Caching & Metrics
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.system.enableCaching}
                  onChange={(e) =>
                    handleSettingChange(
                      "system",
                      "enableCaching",
                      e.target.checked
                    )
                  }
                />
              }
              label="Enable Caching"
              sx={{ mb: 2 }}
            />

            <TextField
              label="Cache Size (MB)"
              type="number"
              value={settings.system.cacheSize}
              onChange={(e) =>
                handleSettingChange(
                  "system",
                  "cacheSize",
                  Number(e.target.value)
                )
              }
              fullWidth
              sx={{ mb: 2 }}
              disabled={!settings.system.enableCaching}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.system.enableMetrics}
                  onChange={(e) =>
                    handleSettingChange(
                      "system",
                      "enableMetrics",
                      e.target.checked
                    )
                  }
                />
              }
              label="Enable Metrics Collection"
              sx={{ mb: 2 }}
            />

            <TextField
              label="Metrics Retention (hours)"
              type="number"
              value={settings.system.metricsRetention}
              onChange={(e) =>
                handleSettingChange(
                  "system",
                  "metricsRetention",
                  Number(e.target.value)
                )
              }
              fullWidth
              disabled={!settings.system.enableMetrics}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderSecurityTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Authentication is currently disabled to allow easy access to the
            dashboard. Enable authentication in production environments.
          </Typography>
        </Alert>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Authentication
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.security.enableAuthentication}
                  onChange={(e) =>
                    handleSettingChange(
                      "security",
                      "enableAuthentication",
                      e.target.checked
                    )
                  }
                />
              }
              label="Enable Authentication"
              sx={{ mb: 2 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.security.allowAnonymousAccess}
                  onChange={(e) =>
                    handleSettingChange(
                      "security",
                      "allowAnonymousAccess",
                      e.target.checked
                    )
                  }
                />
              }
              label="Allow Anonymous Access"
              sx={{ mb: 2 }}
            />

            <TextField
              label="Session Timeout (seconds)"
              type="number"
              value={settings.security.sessionTimeout}
              onChange={(e) =>
                handleSettingChange(
                  "security",
                  "sessionTimeout",
                  Number(e.target.value)
                )
              }
              fullWidth
              sx={{ mb: 2 }}
              disabled={!settings.security.enableAuthentication}
            />

            <TextField
              label="Max Login Attempts"
              type="number"
              value={settings.security.maxLoginAttempts}
              onChange={(e) =>
                handleSettingChange(
                  "security",
                  "maxLoginAttempts",
                  Number(e.target.value)
                )
              }
              fullWidth
              disabled={!settings.security.enableAuthentication}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Security Policies
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.security.enableTwoFactor}
                  onChange={(e) =>
                    handleSettingChange(
                      "security",
                      "enableTwoFactor",
                      e.target.checked
                    )
                  }
                />
              }
              label="Enable Two-Factor Authentication"
              sx={{ mb: 2 }}
              disabled={!settings.security.enableAuthentication}
            />

            <TextField
              label="Minimum Password Length"
              type="number"
              value={settings.security.passwordMinLength}
              onChange={(e) =>
                handleSettingChange(
                  "security",
                  "passwordMinLength",
                  Number(e.target.value)
                )
              }
              fullWidth
              sx={{ mb: 2 }}
              disabled={!settings.security.enableAuthentication}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.security.enableAuditLog}
                  onChange={(e) =>
                    handleSettingChange(
                      "security",
                      "enableAuditLog",
                      e.target.checked
                    )
                  }
                />
              }
              label="Enable Audit Logging"
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderBackupRestoreTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Configuration Backup
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Export or import system configuration settings
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={exportSettings}
                fullWidth
              >
                Export Settings
              </Button>

              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                fullWidth
              >
                Import Settings
                <input
                  type="file"
                  hidden
                  accept=".json"
                  onChange={importSettings}
                />
              </Button>

              <Button
                variant="outlined"
                color="warning"
                startIcon={<RestoreIcon />}
                onClick={handleResetSettings}
                fullWidth
              >
                Reset to Defaults
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Data Backup Status
            </Typography>

            <List>
              <ListItem>
                <ListItemText primary="Last Backup" secondary="2 hours ago" />
                <ListItemSecondaryAction>
                  <Chip label="Success" color="success" size="small" />
                </ListItemSecondaryAction>
              </ListItem>

              <ListItem>
                <ListItemText primary="Backup Size" secondary="24.5 MB" />
              </ListItem>

              <ListItem>
                <ListItemText
                  primary="Files Backed Up"
                  secondary="1,247 files"
                />
              </ListItem>

              <ListItem>
                <ListItemText
                  primary="Next Backup"
                  secondary={`In ${24 - new Date().getHours()} hours`}
                />
              </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            <Button
              variant="contained"
              startIcon={<BackupIcon />}
              onClick={() => setBackupDialogOpen(true)}
              fullWidth
            >
              Create Backup Now
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ width: "100%" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          System Settings
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          {unsavedChanges && (
            <Chip
              label="Unsaved Changes"
              color="warning"
              icon={<WarningIcon />}
              size="small"
            />
          )}
          <Button
            variant="outlined"
            startIcon={<RestoreIcon />}
            onClick={handleResetSettings}
            disabled={saving}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveSettings}
            disabled={saving || !unsavedChanges}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Box>
      </Box>

      {/* Progress Bar */}
      {saving && <LinearProgress sx={{ mb: 2 }} />}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabLabels.map((label, index) => (
            <Tab key={index} label={label} />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box>
        {activeTab === 0 && renderDetectionForecastTab()}
        {activeTab === 1 && renderAlertsTab()}
        {activeTab === 2 && renderDataManagementTab()}
        {activeTab === 3 && renderSystemTab()}
        {activeTab === 4 && renderSecurityTab()}
        {activeTab === 5 && renderBackupRestoreTab()}
      </Box>

      {/* Confirmation Dialogs */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Reset Settings</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reset all settings to their default values?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => {
              confirmReset();
              setConfirmDialogOpen(false);
            }}
          >
            Reset Settings
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={backupDialogOpen}
        onClose={() => setBackupDialogOpen(false)}
      >
        <DialogTitle>Create Backup</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            This will create a backup of all current data and settings.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Estimated time: 2-3 minutes
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackupDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              showSnackbar("Backup started successfully", "success");
              setBackupDialogOpen(false);
            }}
          >
            Start Backup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SystemSettings;
