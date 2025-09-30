#!/usr/bin/env node

/**
 * Upload Results Script
 *
 * Reads detection and forecast JSON files from the results folder
 * and uploads them to MongoDB for remote access
 */

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Import models
const Detection = require("./src/models/Detection");
const Forecast = require("./src/models/Forecast");

// Configuration
const RESULTS_FOLDER = path.resolve(__dirname, "../../results");
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/crowd-management";

// Utility functions
const log = (message, ...args) => {
  console.log(`[${new Date().toISOString()}] ${message}`, ...args);
};

const error = (message, ...args) => {
  console.error(`[${new Date().toISOString()}] ERROR: ${message}`, ...args);
};

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    log("Connected to MongoDB successfully");
    return true;
  } catch (err) {
    error("Failed to connect to MongoDB:", err.message);
    return false;
  }
}

// Read and parse JSON file
function readJSONFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
  } catch (err) {
    error(`Failed to read/parse ${filePath}:`, err.message);
    return null;
  }
}

// Upload detection file to MongoDB
async function uploadDetection(filename, data) {
  try {
    // Check if already exists
    const existing = await Detection.findByFilename(filename);
    if (existing) {
      log(`Detection ${filename} already exists, skipping...`);
      return { success: true, skipped: true };
    }

    // Create new detection document
    const detection = Detection.createFromFile(filename, data, {
      source: "file",
      cameraId: "main-camera",
    });

    await detection.save();
    log(`✓ Uploaded detection: ${filename} (${data.length} frames)`);
    return { success: true, skipped: false };
  } catch (err) {
    error(`Failed to upload detection ${filename}:`, err.message);
    return { success: false, error: err.message };
  }
}

// Upload forecast file to MongoDB
async function uploadForecast(filename, data) {
  try {
    // Check if already exists
    const existing = await Forecast.findByFilename(filename);
    if (existing) {
      log(`Forecast ${filename} already exists, skipping...`);
      return { success: true, skipped: true };
    }

    // Create new forecast document
    const forecast = Forecast.createFromFile(filename, data, {
      source: "file",
      cameraId: "main-camera",
    });

    await forecast.save();
    log(
      `✓ Uploaded forecast: ${filename} (LSTM: ${
        data.lstm_predictions?.length || 0
      }, Linear: ${data.linear_predictions?.length || 0} predictions)`
    );
    return { success: true, skipped: false };
  } catch (err) {
    error(`Failed to upload forecast ${filename}:`, err.message);
    return { success: false, error: err.message };
  }
}

// Process all files in results folder
async function processResultsFolder() {
  if (!fs.existsSync(RESULTS_FOLDER)) {
    error(`Results folder not found: ${RESULTS_FOLDER}`);
    return false;
  }

  const files = fs.readdirSync(RESULTS_FOLDER);
  const detectionFiles = files.filter(
    (f) => f.startsWith("detections_") && f.endsWith(".json")
  );
  const forecastFiles = files.filter(
    (f) => f.startsWith("forecast_") && f.endsWith(".json")
  );

  log(
    `Found ${detectionFiles.length} detection files and ${forecastFiles.length} forecast files`
  );

  const stats = {
    detections: { uploaded: 0, skipped: 0, failed: 0 },
    forecasts: { uploaded: 0, skipped: 0, failed: 0 },
  };

  // Process detection files
  log("\n--- Processing Detection Files ---");
  for (const filename of detectionFiles) {
    const filePath = path.join(RESULTS_FOLDER, filename);
    const data = readJSONFile(filePath);

    if (data) {
      const result = await uploadDetection(filename, data);
      if (result.success) {
        if (result.skipped) {
          stats.detections.skipped++;
        } else {
          stats.detections.uploaded++;
        }
      } else {
        stats.detections.failed++;
      }
    } else {
      stats.detections.failed++;
    }
  }

  // Process forecast files
  log("\n--- Processing Forecast Files ---");
  for (const filename of forecastFiles) {
    const filePath = path.join(RESULTS_FOLDER, filename);
    const data = readJSONFile(filePath);

    if (data) {
      const result = await uploadForecast(filename, data);
      if (result.success) {
        if (result.skipped) {
          stats.forecasts.skipped++;
        } else {
          stats.forecasts.uploaded++;
        }
      } else {
        stats.forecasts.failed++;
      }
    } else {
      stats.forecasts.failed++;
    }
  }

  // Print summary
  log("\n--- Upload Summary ---");
  log(
    `Detections: ${stats.detections.uploaded} uploaded, ${stats.detections.skipped} skipped, ${stats.detections.failed} failed`
  );
  log(
    `Forecasts: ${stats.forecasts.uploaded} uploaded, ${stats.forecasts.skipped} skipped, ${stats.forecasts.failed} failed`
  );

  const totalUploaded = stats.detections.uploaded + stats.forecasts.uploaded;
  const totalFailed = stats.detections.failed + stats.forecasts.failed;

  log(`\nTotal: ${totalUploaded} files uploaded successfully`);

  if (totalFailed > 0) {
    error(`${totalFailed} files failed to upload`);
    return false;
  }

  return true;
}

// Clear existing data (optional)
async function clearExistingData() {
  try {
    const detectionCount = await Detection.countDocuments();
    const forecastCount = await Forecast.countDocuments();

    if (detectionCount > 0 || forecastCount > 0) {
      log(
        `Found ${detectionCount} existing detections and ${forecastCount} existing forecasts`
      );

      // For safety, we won't auto-delete. Instead, we'll skip existing files
      log("Existing data will be preserved. Only new files will be uploaded.");
    }

    return true;
  } catch (err) {
    error("Failed to check existing data:", err.message);
    return false;
  }
}

// Verify uploads
async function verifyUploads() {
  try {
    const detectionCount = await Detection.countDocuments();
    const forecastCount = await Forecast.countDocuments();

    log(`\n--- Verification ---`);
    log(`Total detections in database: ${detectionCount}`);
    log(`Total forecasts in database: ${forecastCount}`);

    // Get some sample data
    const latestDetection = await Detection.findOne().sort({ processedAt: -1 });
    const latestForecast = await Forecast.findOne().sort({ processedAt: -1 });

    if (latestDetection) {
      log(
        `Latest detection: ${latestDetection.filename} (${
          latestDetection.detections?.length || 0
        } frames)`
      );
    }

    if (latestForecast) {
      log(
        `Latest forecast: ${latestForecast.filename} (${
          latestForecast.steps || 0
        } steps)`
      );
    }

    return true;
  } catch (err) {
    error("Failed to verify uploads:", err.message);
    return false;
  }
}

// Main function
async function main() {
  log("Starting results upload process...");

  // Connect to database
  if (!(await connectDB())) {
    process.exit(1);
  }

  try {
    // Clear/check existing data
    if (!(await clearExistingData())) {
      process.exit(1);
    }

    // Process all files
    if (!(await processResultsFolder())) {
      process.exit(1);
    }

    // Verify uploads
    if (!(await verifyUploads())) {
      process.exit(1);
    }

    log("\n✓ Upload process completed successfully!");
  } catch (err) {
    error("Upload process failed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    log("Database connection closed");
  }
}

// Handle CLI arguments
const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(`
Usage: node uploadResults.js [options]

Options:
  --help, -h          Show this help message
  --force-clear       Clear existing data before upload (WARNING: destructive)
  --dry-run           Show what would be uploaded without actually uploading

Environment Variables:
  MONGODB_URI         MongoDB connection string (default: mongodb://localhost:27017/crowd-management)
  
Examples:
  node uploadResults.js                 # Upload new files, preserve existing
  node uploadResults.js --dry-run       # Show what would be uploaded
  node uploadResults.js --force-clear   # Clear all and re-upload
  `);
  process.exit(0);
}

// Add dry-run support
if (args.includes("--dry-run")) {
  log("DRY RUN MODE: No actual uploads will be performed");
  // Override upload functions for dry run
  const originalUploadDetection = uploadDetection;
  const originalUploadForecast = uploadForecast;

  uploadDetection = async (filename, data) => {
    log(
      `[DRY RUN] Would upload detection: ${filename} (${data.length} frames)`
    );
    return { success: true, skipped: false };
  };

  uploadForecast = async (filename, data) => {
    log(
      `[DRY RUN] Would upload forecast: ${filename} (LSTM: ${
        data.lstm_predictions?.length || 0
      }, Linear: ${data.linear_predictions?.length || 0} predictions)`
    );
    return { success: true, skipped: false };
  };
}

// Add force clear support
if (args.includes("--force-clear")) {
  log("WARNING: Force clear mode enabled - existing data will be deleted!");
  clearExistingData = async () => {
    try {
      await Detection.deleteMany({});
      await Forecast.deleteMany({});
      log("✓ Existing data cleared");
      return true;
    } catch (err) {
      error("Failed to clear existing data:", err.message);
      return false;
    }
  };
}

// Run the script
if (require.main === module) {
  main().catch((err) => {
    error("Unhandled error:", err);
    process.exit(1);
  });
}

module.exports = {
  main,
  processResultsFolder,
  uploadDetection,
  uploadForecast,
};
