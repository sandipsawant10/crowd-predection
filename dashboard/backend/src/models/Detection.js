/**
 * Detection Model
 *
 * Mongoose schema for detection result data
 * Supports both real-time detections and file-based detections
 */

const mongoose = require("mongoose");

const detectionSchema = new mongoose.Schema(
  {
    // File metadata
    filename: {
      type: String,
      required: true,
      index: true,
    },

    // Source information
    source: {
      type: String,
      enum: ["video", "camera", "file"], // NOTE: "camera" kept for legacy compatibility
      default: "file", // Default changed to "file" for new file-based system
    },

    videoFile: {
      type: String,
      required: false,
    },

    cameraId: {
      type: String,
      required: false,
      // NOTE: Field name kept for backward compatibility - now also accepts locationId values
    },

    // Detection data array
    detections: [
      {
        timestamp: {
          type: Date,
          required: true,
        },

        frame: {
          type: Number,
          required: true,
        },

        count: {
          type: Number,
          required: true,
          min: 0,
        },

        average_count: {
          type: Number,
          required: true,
          min: 0,
        },

        alert: {
          type: Boolean,
          required: true,
          default: false,
        },

        // Optional: bounding boxes or other detection details
        boundingBoxes: [
          {
            x: Number,
            y: Number,
            width: Number,
            height: Number,
            confidence: Number,
          },
        ],

        // Optional: additional metadata
        processingTime: Number,
        modelVersion: String,
      },
    ],

    // File processing metadata
    processedAt: {
      type: Date,
      default: Date.now,
    },

    fileSize: {
      type: Number,
      required: false,
    },

    frameCount: {
      type: Number,
      required: false,
    },

    duration: {
      type: Number, // in seconds
      required: false,
    },

    // Analysis summary
    summary: {
      totalFrames: Number,
      maxCount: Number,
      minCount: Number,
      averageCount: Number,
      alertFrames: Number,
      alertPercentage: Number,
    },
  },
  {
    timestamps: true,
    collection: "detections",
  }
);

// Indexes for efficient querying
detectionSchema.index({ filename: 1, "detections.frame": 1 });
detectionSchema.index({ source: 1, processedAt: -1 });
detectionSchema.index({ "detections.timestamp": -1 });
detectionSchema.index({ "summary.maxCount": -1 });

// Virtual for getting the latest detection
detectionSchema.virtual("latestDetection").get(function () {
  if (this.detections && this.detections.length > 0) {
    return this.detections[this.detections.length - 1];
  }
  return null;
});

// Method to add new detection data
detectionSchema.methods.addDetection = function (detectionData) {
  this.detections.push(detectionData);
  this.updateSummary();
  return this;
};

// Method to update summary statistics
detectionSchema.methods.updateSummary = function () {
  if (!this.detections || this.detections.length === 0) {
    return this;
  }

  const counts = this.detections.map((d) => d.count);
  const alertFrames = this.detections.filter((d) => d.alert).length;

  this.summary = {
    totalFrames: this.detections.length,
    maxCount: Math.max(...counts),
    minCount: Math.min(...counts),
    averageCount: counts.reduce((sum, count) => sum + count, 0) / counts.length,
    alertFrames: alertFrames,
    alertPercentage: (alertFrames / this.detections.length) * 100,
  };

  return this;
};

// Static method to create from file data
detectionSchema.statics.createFromFile = function (
  filename,
  fileData,
  metadata = {}
) {
  const detectionDoc = new this({
    filename,
    source: metadata.source || "file",
    videoFile: metadata.videoFile,
    cameraId: metadata.cameraId,
    detections: Array.isArray(fileData) ? fileData : [fileData],
    fileSize: metadata.fileSize,
    frameCount: Array.isArray(fileData) ? fileData.length : 1,
    duration: metadata.duration,
  });

  detectionDoc.updateSummary();
  return detectionDoc;
};

// Static method to find by filename
detectionSchema.statics.findByFilename = function (filename) {
  return this.findOne({ filename }).exec();
};

// Static method to get latest detections
detectionSchema.statics.getLatest = function (limit = 10) {
  return this.find().sort({ processedAt: -1 }).limit(limit).exec();
};

// Pre-save middleware to ensure summary is updated
detectionSchema.pre("save", function (next) {
  if (this.isModified("detections") && this.detections.length > 0) {
    this.updateSummary();
  }
  next();
});

module.exports = mongoose.model("Detection", detectionSchema);
