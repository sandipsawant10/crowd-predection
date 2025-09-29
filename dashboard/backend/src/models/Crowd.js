// src/models/Crowd.js
const mongoose = require("mongoose");

const crowdSchema = new mongoose.Schema(
  {
    cameraId: {
      type: String,
      required: [true, "Camera ID is required"],
      index: true,
    },
    timestamp: {
      type: Date,
      required: [true, "Timestamp is required"],
      default: Date.now,
      index: true,
    },
    count: {
      type: Number,
      required: [true, "Crowd count is required"],
      min: [0, "Count cannot be negative"],
    },
    prediction: {
      type: [Number],
      required: [true, "Prediction array is required"],
      validate: {
        validator: function (arr) {
          return arr.length === 6; // Expecting 6 predictions for next 30 minutes (5-min intervals)
        },
        message: "Prediction must contain exactly 6 values",
      },
    },
    alertTriggered: {
      type: Boolean,
      default: false,
    },
    density: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },
    metadata: {
      processingTime: Number,
      confidence: Number,
      modelVersion: String,
    },
  },
  {
    timestamps: true,
    indexes: [
      { cameraId: 1, timestamp: -1 }, // Compound index for efficient queries
    ],
  }
);

// Virtual to calculate average predicted count
crowdSchema.virtual("averagePrediction").get(function () {
  if (!this.prediction || this.prediction.length === 0) return 0;
  return (
    this.prediction.reduce((sum, val) => sum + val, 0) / this.prediction.length
  );
});

// Virtual to calculate predicted trend (increasing, decreasing, stable)
crowdSchema.virtual("trend").get(function () {
  if (!this.prediction || this.prediction.length < 2) return "stable";

  const first = this.prediction[0];
  const last = this.prediction[this.prediction.length - 1];

  const percentChange = ((last - first) / first) * 100;

  if (percentChange > 10) return "increasing";
  if (percentChange < -10) return "decreasing";
  return "stable";
});

// Static method to find latest entry for each camera
crowdSchema.statics.getLatestForAllCameras = async function () {
  return this.aggregate([
    { $sort: { timestamp: -1 } },
    {
      $group: {
        _id: "$cameraId",
        doc: { $first: "$$ROOT" },
      },
    },
    { $replaceRoot: { newRoot: "$doc" } },
    { $sort: { cameraId: 1 } },
  ]);
};

// Instance method to check if crowd exceeds threshold
crowdSchema.methods.exceedsThreshold = function (threshold) {
  return this.count >= threshold;
};

const Crowd = mongoose.model("Crowd", crowdSchema);

module.exports = Crowd;
