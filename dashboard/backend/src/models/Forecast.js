/**
 * Forecast Model
 *
 * Mongoose schema for forecast result data
 * Supports LSTM and Linear prediction models
 */

const mongoose = require("mongoose");

const forecastSchema = new mongoose.Schema(
  {
    // File metadata
    filename: {
      type: String,
      required: true,
      index: true,
      unique: true,
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

    // Base frame information
    timestamp: {
      type: Date,
      required: true,
    },

    frame: {
      type: Number,
      required: true,
    },

    // LSTM predictions
    lstm_predictions: [
      {
        type: Number,
        required: true,
      },
    ],

    // Linear predictions
    linear_predictions: [
      {
        type: Number,
        required: true,
      },
    ],

    // Model parameters
    window_size: {
      type: Number,
      required: true,
      default: 30,
    },

    steps: {
      type: Number,
      required: true,
      default: 10,
    },

    // Model metadata
    modelVersion: {
      lstm: String,
      linear: String,
    },

    confidence: {
      lstm: {
        type: Number,
        min: 0,
        max: 1,
      },
      linear: {
        type: Number,
        min: 0,
        max: 1,
      },
    },

    // Processing metadata
    processedAt: {
      type: Date,
      default: Date.now,
    },

    processingTime: {
      type: Number, // in milliseconds
      required: false,
    },

    // Analysis summary
    summary: {
      lstm: {
        min: Number,
        max: Number,
        average: Number,
        trend: {
          type: String,
          enum: ["increasing", "decreasing", "stable"],
        },
      },
      linear: {
        min: Number,
        max: Number,
        average: Number,
        trend: {
          type: String,
          enum: ["increasing", "decreasing", "stable"],
        },
      },
      comparison: {
        avgDifference: Number,
        correlationCoefficient: Number,
      },
    },
  },
  {
    timestamps: true,
    collection: "forecasts",
  }
);

// Indexes for efficient querying
forecastSchema.index({ filename: 1 });
forecastSchema.index({ source: 1, processedAt: -1 });
forecastSchema.index({ frame: 1, timestamp: -1 });
forecastSchema.index({ "summary.lstm.max": -1 });
forecastSchema.index({ "summary.linear.max": -1 });

// Virtual for getting prediction timeframes
forecastSchema.virtual("predictionTimeframes").get(function () {
  const baseTime = new Date(this.timestamp);
  return Array.from({ length: this.steps }, (_, i) => {
    const futureTime = new Date(baseTime.getTime() + (i + 1) * 5000); // Assuming 5 second intervals
    return futureTime;
  });
});

// Method to calculate summary statistics
forecastSchema.methods.updateSummary = function () {
  if (!this.lstm_predictions || !this.linear_predictions) {
    return this;
  }

  // LSTM summary
  const lstmMin = Math.min(...this.lstm_predictions);
  const lstmMax = Math.max(...this.lstm_predictions);
  const lstmAvg =
    this.lstm_predictions.reduce((sum, val) => sum + val, 0) /
    this.lstm_predictions.length;
  const lstmTrend = this.calculateTrend(this.lstm_predictions);

  // Linear summary
  const linearMin = Math.min(...this.linear_predictions);
  const linearMax = Math.max(...this.linear_predictions);
  const linearAvg =
    this.linear_predictions.reduce((sum, val) => sum + val, 0) /
    this.linear_predictions.length;
  const linearTrend = this.calculateTrend(this.linear_predictions);

  // Comparison
  const differences = this.lstm_predictions.map((lstm, i) =>
    Math.abs(lstm - this.linear_predictions[i])
  );
  const avgDifference =
    differences.reduce((sum, diff) => sum + diff, 0) / differences.length;

  // Correlation coefficient
  const correlationCoeff = this.calculateCorrelation(
    this.lstm_predictions,
    this.linear_predictions
  );

  this.summary = {
    lstm: {
      min: lstmMin,
      max: lstmMax,
      average: lstmAvg,
      trend: lstmTrend,
    },
    linear: {
      min: linearMin,
      max: linearMax,
      average: linearAvg,
      trend: linearTrend,
    },
    comparison: {
      avgDifference: avgDifference,
      correlationCoefficient: correlationCoeff,
    },
  };

  return this;
};

// Method to calculate trend direction
forecastSchema.methods.calculateTrend = function (predictions) {
  if (predictions.length < 2) return "stable";

  const first = predictions[0];
  const last = predictions[predictions.length - 1];
  const threshold = 0.1; // 10% change threshold

  const changePercent = Math.abs((last - first) / first);

  if (changePercent < threshold) {
    return "stable";
  } else if (last > first) {
    return "increasing";
  } else {
    return "decreasing";
  }
};

// Method to calculate correlation coefficient
forecastSchema.methods.calculateCorrelation = function (x, y) {
  const n = x.length;

  if (n !== y.length || n === 0) return 0;

  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumXX = x.reduce((sum, val) => sum + val * val, 0);
  const sumYY = y.reduce((sum, val) => sum + val * val, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY)
  );

  return denominator === 0 ? 0 : numerator / denominator;
};

// Method to get predictions for specific time ranges
forecastSchema.methods.getPredictionsForRange = function (startStep, endStep) {
  const start = Math.max(0, startStep);
  const end = Math.min(this.steps - 1, endStep);

  return {
    lstm: this.lstm_predictions.slice(start, end + 1),
    linear: this.linear_predictions.slice(start, end + 1),
    steps: end - start + 1,
    timeframes: this.predictionTimeframes.slice(start, end + 1),
  };
};

// Static method to create from file data
forecastSchema.statics.createFromFile = function (
  filename,
  fileData,
  metadata = {}
) {
  const forecastDoc = new this({
    filename,
    source: metadata.source || "file",
    videoFile: metadata.videoFile,
    cameraId: metadata.cameraId,
    timestamp: new Date(fileData.timestamp),
    frame: fileData.frame,
    lstm_predictions: fileData.lstm_predictions,
    linear_predictions: fileData.linear_predictions,
    window_size: fileData.window_size,
    steps: fileData.steps,
    modelVersion: metadata.modelVersion,
    confidence: metadata.confidence,
    processingTime: metadata.processingTime,
  });

  forecastDoc.updateSummary();
  return forecastDoc;
};

// Static method to find by filename
forecastSchema.statics.findByFilename = function (filename) {
  return this.findOne({ filename }).exec();
};

// Static method to get latest forecasts
forecastSchema.statics.getLatest = function (limit = 10) {
  return this.find().sort({ processedAt: -1 }).limit(limit).exec();
};

// Static method to get forecasts by frame range
forecastSchema.statics.getByFrameRange = function (startFrame, endFrame) {
  return this.find({
    frame: {
      $gte: startFrame,
      $lte: endFrame,
    },
  })
    .sort({ frame: 1 })
    .exec();
};

// Pre-save middleware to ensure summary is updated
forecastSchema.pre("save", function (next) {
  if (
    this.isModified("lstm_predictions") ||
    this.isModified("linear_predictions")
  ) {
    this.updateSummary();
  }
  next();
});

module.exports = mongoose.model("Forecast", forecastSchema);
