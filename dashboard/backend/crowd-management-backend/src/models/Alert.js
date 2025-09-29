// src/models/Alert.js
const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
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
    type: {
      type: String,
      required: [true, "Alert type is required"],
      enum: [
        "HighCrowd",
        "RapidIncrease",
        "SecurityBreach",
        "SystemFailure",
        "Other",
      ],
    },
    message: {
      type: String,
      required: [true, "Alert message is required"],
      trim: true,
    },
    triggeredBy: {
      type: String,
      required: [true, "Trigger source is required"],
      enum: ["system", "admin"],
    },
    crowdCount: {
      type: Number,
      min: [0, "Count cannot be negative"],
    },
    status: {
      type: String,
      enum: ["active", "acknowledged", "resolved"],
      default: "active",
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    acknowledgedAt: {
      type: Date,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    indexes: [
      { cameraId: 1, timestamp: -1 },
      { status: 1, timestamp: -1 },
    ],
  }
);

const Alert = mongoose.model("Alert", alertSchema);

module.exports = Alert;
