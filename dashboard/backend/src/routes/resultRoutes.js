/**
 * Results Routes
 *
 * API endpoints for consuming detection and forecast result files
 *
 * NOTE: ML processing happens externally. This system only monitors and serves
 * result files that are automatically written to the results folder by external
 * ML processes.
 *
 * Endpoints:
 * - GET /api/results/files - List all available files with metadata
 * - GET /api/results/files/:filename - Get contents of specific file
 * - GET /api/results/latest/:type - Get latest file of specific type (detection/forecast)
 * - GET /api/results/stats - Get file statistics and summary
 */

const express = require("express");
const router = express.Router();
const FileWatcherService = require("../services/fileWatcherService");

// Get fileWatcher instance from app or use singleton
function getFileWatcher(req) {
  return req.app.get("fileWatcher") || FileWatcherService.instance;
}

/**
 * Get list of all available result files with metadata
 */
router.get("/files", async (req, res) => {
  try {
    const fileWatcher = getFileWatcher(req);
    const files = fileWatcher.getAvailableFiles();

    res.json({
      success: true,
      count: files.length,
      files: files.map((file) => ({
        filename: file.filename,
        type: file.type,
        frameNumber: file.frameNumber,
        size: file.size,
        created: file.created,
        modified: file.modified,
        sizeFormatted: formatFileSize(file.size),
      })),
    });
  } catch (error) {
    console.error("Error fetching file list:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch file list",
      error: error.message,
    });
  }
});

/**
 * Get contents of a specific file
 */
router.get("/files/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const fileWatcher = getFileWatcher(req);

    if (!fileWatcher.isValidFile(filename)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid file format. Expected detections_*.json or forecast_*.json",
      });
    }

    const fileContents = await fileWatcher.getFileContents(filename);

    console.log(`[IMPORTANT] File contents requested: ${filename}`);

    res.json({
      success: true,
      ...fileContents,
    });
  } catch (error) {
    console.error(`Error fetching file ${req.params.filename}:`, error);
    res.status(404).json({
      success: false,
      message: "File not found or could not be read",
      error: error.message,
    });
  }
});

/**
 * Get latest file of specific type (detection or forecast)
 */
router.get("/latest/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const fileWatcher = getFileWatcher(req);

    if (!["detection", "forecast"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Expected "detection" or "forecast"',
      });
    }

    const latestFile = fileWatcher.getLatestFile(type);

    if (!latestFile) {
      return res.status(404).json({
        success: false,
        message: `No ${type} files found`,
      });
    }

    const fileContents = await fileWatcher.getFileContents(latestFile.filename);

    console.log(
      `[IMPORTANT] Latest ${type} file requested: ${latestFile.filename}`
    );

    res.json({
      success: true,
      ...fileContents,
    });
  } catch (error) {
    console.error(`Error fetching latest ${req.params.type}:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch latest file",
      error: error.message,
    });
  }
});

/**
 * Clean up old result files
 */
router.post("/cleanup", async (req, res) => {
  try {
    const { maxFiles = 50 } = req.body;
    const fileWatcher = getFileWatcher(req);

    console.log(
      `[IMPORTANT] File cleanup requested - keeping ${maxFiles} files`
    );

    fileWatcher.cleanupOldFiles(maxFiles);

    const remainingFiles = fileWatcher.getAvailableFiles();

    res.json({
      success: true,
      message: "Cleanup completed successfully",
      remainingFiles: remainingFiles.length,
    });
  } catch (error) {
    console.error("Error during cleanup:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cleanup files",
      error: error.message,
    });
  }
});

/**
 * Get file statistics and summary
 */
router.get("/stats", async (req, res) => {
  try {
    const fileWatcher = getFileWatcher(req);
    const files = fileWatcher.getAvailableFiles();

    const stats = {
      total: files.length,
      detectionFiles: files.filter((f) => f.type === "detection").length,
      forecastFiles: files.filter((f) => f.type === "forecast").length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
      latestDetection: fileWatcher.getLatestFile("detection"),
      latestForecast: fileWatcher.getLatestFile("forecast"),
    };

    res.json({
      success: true,
      stats: {
        ...stats,
        totalSizeFormatted: formatFileSize(stats.totalSize),
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
});

// Utility function to format file sizes
function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

module.exports = router;
