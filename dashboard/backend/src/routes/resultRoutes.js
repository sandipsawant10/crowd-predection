/**
 * Results Routes
 *
 * API endpoints for consuming detection and forecast result files
 *
 * Supports both MongoDB (for remote access) and file-based (for local access) data sources.
 * MongoDB is checked first, then falls back to local files if not available.
 *
 * Endpoints:
 * - GET /api/results/files - List all available files with metadata (MongoDB + files)
 * - GET /api/results/files/:filename - Get contents of specific file
 * - GET /api/results/latest/:type - Get latest file of specific type (detection/forecast)
 * - GET /api/results/stats - Get file statistics and summary
 * - GET /api/results/all - Get all detection data (optimized for dashboard)
 * - POST /api/results/upload - Upload results folder to MongoDB
 */

const express = require("express");
const router = express.Router();
const FileWatcherService = require("../services/fileWatcherService");
const Detection = require("../models/Detection");
const Forecast = require("../models/Forecast");

// Get fileWatcher instance from app or use singleton
function getFileWatcher(req) {
  return req.app.get("fileWatcher") || FileWatcherService.instance;
}

/**
 * Get list of all available result files with metadata (MongoDB + files)
 */
router.get("/files", async (req, res) => {
  try {
    const fileWatcher = getFileWatcher(req);
    let files = [];
    let sources = [];

    // Try to get files from MongoDB first
    try {
      const [detections, forecasts] = await Promise.all([
        Detection.find({}, "filename processedAt summary source").sort({
          processedAt: -1,
        }),
        Forecast.find({}, "filename processedAt summary source").sort({
          processedAt: -1,
        }),
      ]);

      if (detections.length > 0 || forecasts.length > 0) {
        sources.push("mongodb");

        // Convert MongoDB documents to file format
        const dbFiles = [
          ...detections.map((d) => ({
            filename: d.filename,
            type: "detection",
            source: "mongodb",
            created: d.processedAt,
            modified: d.processedAt,
            summary: d.summary,
            frameCount: d.summary?.totalFrames || 0,
          })),
          ...forecasts.map((f) => ({
            filename: f.filename,
            type: "forecast",
            source: "mongodb",
            created: f.processedAt,
            modified: f.processedAt,
            summary: f.summary,
            steps: f.steps || 0,
          })),
        ];

        files = files.concat(dbFiles);
      }
    } catch (dbError) {
      console.log(
        "MongoDB not available, falling back to files:",
        dbError.message
      );
    }

    // Also get files from filesystem
    try {
      const localFiles = fileWatcher.getAvailableFiles();
      if (localFiles.length > 0) {
        sources.push("filesystem");

        const fileSystemFiles = localFiles.map((file) => ({
          filename: file.filename,
          type: file.type,
          source: "filesystem",
          frameNumber: file.frameNumber,
          size: file.size,
          created: file.created,
          modified: file.modified,
          sizeFormatted: formatFileSize(file.size),
        }));

        files = files.concat(fileSystemFiles);
      }
    } catch (fsError) {
      console.log("Filesystem access error:", fsError.message);
    }

    // Remove duplicates (prefer MongoDB over filesystem)
    const uniqueFiles = files.reduce((acc, file) => {
      const existing = acc.find((f) => f.filename === file.filename);
      if (
        !existing ||
        (existing.source === "filesystem" && file.source === "mongodb")
      ) {
        acc = acc.filter((f) => f.filename !== file.filename);
        acc.push(file);
      }
      return acc;
    }, []);

    res.json({
      success: true,
      count: uniqueFiles.length,
      sources: sources,
      files: uniqueFiles.sort(
        (a, b) => new Date(b.modified) - new Date(a.modified)
      ),
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
 * Get all detection data (optimized for dashboard analytics)
 */
router.get("/all", async (req, res) => {
  try {
    const { limit = 1000, hours = 24 } = req.query;

    let allDetections = [];
    let source = null;

    // Try MongoDB first
    try {
      const dbDetections = await Detection.find({})
        .sort({ processedAt: -1 })
        .limit(parseInt(limit));

      if (dbDetections.length > 0) {
        source = "mongodb";
        // Flatten detection data from all documents
        allDetections = dbDetections.reduce((acc, doc) => {
          if (doc.detections && Array.isArray(doc.detections)) {
            const fileDetections = doc.detections.map((detection) => ({
              ...detection.toObject(),
              filename: doc.filename,
              source: "mongodb",
            }));
            acc = acc.concat(fileDetections);
          }
          return acc;
        }, []);

        console.log(
          `[IMPORTANT] Retrieved ${allDetections.length} detections from MongoDB`
        );
      }
    } catch (dbError) {
      console.log("MongoDB not available for /all endpoint:", dbError.message);
    }

    // If no MongoDB data, fall back to files
    if (allDetections.length === 0) {
      try {
        const fileWatcher = getFileWatcher(req);
        const files = fileWatcher
          .getAvailableFiles()
          .filter((f) => f.type === "detection");

        source = "filesystem";

        for (const file of files.slice(0, parseInt(limit) / 10)) {
          try {
            const contents = await fileWatcher.getFileContents(file.filename);
            if (contents.data && Array.isArray(contents.data)) {
              const fileDetections = contents.data.map((detection) => ({
                ...detection,
                filename: file.filename,
                source: "filesystem",
              }));
              allDetections = allDetections.concat(fileDetections);
            }
          } catch (fileError) {
            console.log(
              `Error reading file ${file.filename}:`,
              fileError.message
            );
          }
        }

        console.log(
          `[IMPORTANT] Retrieved ${allDetections.length} detections from filesystem`
        );
      } catch (fsError) {
        console.log(
          "Filesystem not available for /all endpoint:",
          fsError.message
        );
      }
    }

    // Sort by timestamp and limit
    allDetections.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    allDetections = allDetections.slice(0, parseInt(limit));

    res.json({
      success: true,
      count: allDetections.length,
      source: source,
      data: allDetections,
    });
  } catch (error) {
    console.error("Error fetching all detections:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch detection data",
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

    // Try MongoDB first
    try {
      if (filename.startsWith("detections_")) {
        const detection = await Detection.findByFilename(filename);
        if (detection) {
          console.log(`[IMPORTANT] File contents from MongoDB: ${filename}`);
          return res.json({
            success: true,
            filename: detection.filename,
            data: detection.detections,
            source: "mongodb",
            summary: detection.summary,
            processedAt: detection.processedAt,
          });
        }
      } else if (filename.startsWith("forecast_")) {
        const forecast = await Forecast.findByFilename(filename);
        if (forecast) {
          console.log(`[IMPORTANT] File contents from MongoDB: ${filename}`);
          return res.json({
            success: true,
            filename: forecast.filename,
            data: {
              timestamp: forecast.timestamp,
              frame: forecast.frame,
              lstm_predictions: forecast.lstm_predictions,
              linear_predictions: forecast.linear_predictions,
              window_size: forecast.window_size,
              steps: forecast.steps,
            },
            source: "mongodb",
            summary: forecast.summary,
            processedAt: forecast.processedAt,
          });
        }
      }
    } catch (dbError) {
      console.log(`MongoDB lookup failed for ${filename}:`, dbError.message);
    }

    // Fall back to filesystem
    const fileWatcher = getFileWatcher(req);

    if (!fileWatcher.isValidFile(filename)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid file format. Expected detections_*.json or forecast_*.json",
      });
    }

    const fileContents = await fileWatcher.getFileContents(filename);

    console.log(`[IMPORTANT] File contents from filesystem: ${filename}`);

    res.json({
      success: true,
      source: "filesystem",
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
 * Upload results folder to MongoDB
 */
router.post("/upload", async (req, res) => {
  try {
    // Import the upload function
    const { processResultsFolder } = require("../../uploadResults");

    console.log("[IMPORTANT] Starting upload of results folder to MongoDB...");

    // Run the upload process
    const success = await processResultsFolder();

    if (success) {
      // Get updated counts
      const [detectionCount, forecastCount] = await Promise.all([
        Detection.countDocuments(),
        Forecast.countDocuments(),
      ]);

      console.log(
        `[IMPORTANT] Upload completed - ${detectionCount} detections, ${forecastCount} forecasts in MongoDB`
      );

      res.json({
        success: true,
        message: "Results folder uploaded to MongoDB successfully",
        counts: {
          detections: detectionCount,
          forecasts: forecastCount,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Upload process encountered errors",
      });
    }
  } catch (error) {
    console.error("Error uploading results:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload results to MongoDB",
      error: error.message,
    });
  }
});

/**
 * Get file statistics and summary
 */
router.get("/stats", async (req, res) => {
  try {
    let stats = {
      filesystem: null,
      mongodb: null,
      combined: null,
    };

    // Get filesystem stats
    try {
      const fileWatcher = getFileWatcher(req);
      const files = fileWatcher.getAvailableFiles();

      stats.filesystem = {
        total: files.length,
        detectionFiles: files.filter((f) => f.type === "detection").length,
        forecastFiles: files.filter((f) => f.type === "forecast").length,
        totalSize: files.reduce((sum, f) => sum + f.size, 0),
        latestDetection: fileWatcher.getLatestFile("detection"),
        latestForecast: fileWatcher.getLatestFile("forecast"),
      };

      stats.filesystem.totalSizeFormatted = formatFileSize(
        stats.filesystem.totalSize
      );
    } catch (fsError) {
      console.log("Filesystem stats error:", fsError.message);
      stats.filesystem = { error: fsError.message };
    }

    // Get MongoDB stats
    try {
      const [detectionCount, forecastCount, latestDetection, latestForecast] =
        await Promise.all([
          Detection.countDocuments(),
          Forecast.countDocuments(),
          Detection.findOne().sort({ processedAt: -1 }),
          Forecast.findOne().sort({ processedAt: -1 }),
        ]);

      stats.mongodb = {
        total: detectionCount + forecastCount,
        detectionFiles: detectionCount,
        forecastFiles: forecastCount,
        latestDetection: latestDetection
          ? {
              filename: latestDetection.filename,
              processedAt: latestDetection.processedAt,
              frames: latestDetection.summary?.totalFrames || 0,
            }
          : null,
        latestForecast: latestForecast
          ? {
              filename: latestForecast.filename,
              processedAt: latestForecast.processedAt,
              steps: latestForecast.steps || 0,
            }
          : null,
      };
    } catch (dbError) {
      console.log("MongoDB stats error:", dbError.message);
      stats.mongodb = { error: dbError.message };
    }

    // Calculate combined stats
    const fsTotal = stats.filesystem?.total || 0;
    const dbTotal = stats.mongodb?.total || 0;

    stats.combined = {
      filesystemAvailable: !stats.filesystem?.error,
      mongodbAvailable: !stats.mongodb?.error,
      preferredSource: dbTotal > 0 ? "mongodb" : "filesystem",
      totalSources:
        (stats.filesystem?.error ? 0 : 1) + (stats.mongodb?.error ? 0 : 1),
    };

    res.json({
      success: true,
      stats: stats,
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
