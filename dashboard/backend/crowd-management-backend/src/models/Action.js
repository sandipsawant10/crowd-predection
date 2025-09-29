// src/models/Action.js
const mongoose = require("mongoose");

const actionSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, "Action type is required"],
      trim: true,
    },
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
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    performedByUsername: {
      type: String,
      required: [true, "Username is required"],
    },
    details: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "failed"],
      default: "completed",
    },
    effectivenessRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    relatedAlertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Alert",
    },
    crowdCountBefore: {
      type: Number,
      min: 0,
    },
    crowdCountAfter: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
    indexes: [
      { cameraId: 1, timestamp: -1 },
      { performedBy: 1, timestamp: -1 },
    ],
  }
);

const Action = mongoose.model("Action", actionSchema);

module.exports = Action;
