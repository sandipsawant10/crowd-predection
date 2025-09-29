// src/models/Camera.js
const mongoose = require("mongoose");

const cameraSchema = new mongoose.Schema(
  {
    cameraId: {
      type: String,
      required: [true, "Camera ID is required"],
      unique: true,
      trim: true,
      index: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance", "offline"],
      default: "inactive",
    },
    lastUpdate: {
      type: Date,
      default: null,
    },
    description: {
      type: String,
      trim: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    maxCapacity: {
      type: Number,
      min: 0,
      default: 1000,
    },
    alertThreshold: {
      type: Number,
      min: 0,
      default: 800, // 80% of max capacity by default
      validate: {
        validator: function (val) {
          return val <= this.maxCapacity;
        },
        message: "Alert threshold cannot exceed maximum capacity",
      },
    },
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
    metadata: {
      model: String,
      manufacturer: String,
      installationDate: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Method to check if camera is active based on last update time
cameraSchema.methods.isActive = function (minutesThreshold = 5) {
  if (!this.lastUpdate) return false;

  const thresholdTime = new Date(Date.now() - minutesThreshold * 60 * 1000);
  return this.lastUpdate >= thresholdTime;
};

// Update camera status based on last update time
cameraSchema.methods.updateStatus = function () {
  if (this.isActive()) {
    this.status = "active";
  } else {
    this.status = "inactive";
  }
  return this.status;
};

// Virtual property for activity status
cameraSchema.virtual("active").get(function () {
  return this.isActive();
});

// Pre-save middleware to update status based on lastUpdate
cameraSchema.pre("save", function (next) {
  if (this.isModified("lastUpdate")) {
    this.updateStatus();
  }
  next();
});

const Camera = mongoose.model("Camera", cameraSchema);

module.exports = Camera;
