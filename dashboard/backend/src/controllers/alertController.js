// src/controllers/alertController.js
const Alert = require("../models/Alert");
const Camera = require("../models/Camera");
const alertService = require("../services/alertService");

/**
 * @desc    Create a new alert
 * @route   POST /api/alerts
 * @access  Private
 */
exports.createAlert = async (req, res, next) => {
  try {
    const { cameraId, timestamp, type, message, triggeredBy } = req.body;

    // Check if camera exists
    const camera = await Camera.findOne({ cameraId });
    if (!camera) {
      return res.status(404).json({
        success: false,
        message: `Camera with ID ${cameraId} not found`,
      });
    }

    // Create the alert using the service
    const alert = await alertService.createAlert(
      {
        cameraId,
        timestamp: timestamp || Date.now(),
        type,
        message,
        triggeredBy: triggeredBy || "admin",
        // Include admin user info if triggered by admin
        ...(req.user && triggeredBy === "admin"
          ? {
              acknowledgedBy: req.user._id,
              acknowledgedAt: Date.now(),
            }
          : {}),
      },
      req.app.get("io")
    );

    res.status(201).json({
      success: true,
      data: alert,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all alerts
 * @route   GET /api/alerts
 * @access  Private
 */
exports.getAlerts = async (req, res, next) => {
  try {
    // Build query from filters
    const query = {};

    // Filter by camera ID
    if (req.query.cameraId) {
      query.cameraId = req.query.cameraId;
    }

    // Filter by alert type
    if (req.query.type) {
      query.type = req.query.type;
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by trigger source
    if (req.query.triggeredBy) {
      query.triggeredBy = req.query.triggeredBy;
    }

    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      query.timestamp = {};

      if (req.query.startDate) {
        query.timestamp.$gte = new Date(req.query.startDate);
      }

      if (req.query.endDate) {
        query.timestamp.$lte = new Date(req.query.endDate);
      }
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    // Get alerts
    const alerts = await Alert.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate("acknowledgedBy", "username")
      .populate("resolvedBy", "username");

    // Get total count for pagination
    const totalAlerts = await Alert.countDocuments(query);

    res.status(200).json({
      success: true,
      count: alerts.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalAlerts / limit),
        total: totalAlerts,
      },
      data: alerts,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get a single alert
 * @route   GET /api/alerts/:id
 * @access  Private
 */
exports.getAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate("acknowledgedBy", "username")
      .populate("resolvedBy", "username");

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    res.status(200).json({
      success: true,
      data: alert,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update alert status
 * @route   PUT /api/alerts/:id/status
 * @access  Private
 */
exports.updateAlertStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["active", "acknowledged", "resolved"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    // Check if alert exists
    let alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    // Update alert status using service
    alert = await alertService.updateAlertStatus(
      req.params.id,
      status,
      req.user
    );

    // Get the Socket.io instance
    const io = req.app.get("io");

    // Emit status update if Socket.io is available
    if (io) {
      io.to(`camera-${alert.cameraId}`).emit("alert-status-update", alert);
      io.to("admin-alerts").emit("alert-status-update", alert);
    }

    res.status(200).json({
      success: true,
      data: alert,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete an alert
 * @route   DELETE /api/alerts/:id
 * @access  Private/Admin
 */
exports.deleteAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    await alert.deleteOne();

    res.status(200).json({
      success: true,
      message: "Alert deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get alert statistics
 * @route   GET /api/alerts/stats
 * @access  Private
 */
exports.getAlertStats = async (req, res, next) => {
  try {
    const stats = await Alert.aggregate([
      // Match by date range if provided
      ...(req.query.startDate || req.query.endDate
        ? [
            {
              $match: {
                timestamp: {
                  ...(req.query.startDate && {
                    $gte: new Date(req.query.startDate),
                  }),
                  ...(req.query.endDate && {
                    $lte: new Date(req.query.endDate),
                  }),
                },
              },
            },
          ]
        : []),

      // Group by type and status
      {
        $group: {
          _id: {
            type: "$type",
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },

      // Format output
      {
        $project: {
          _id: 0,
          type: "$_id.type",
          status: "$_id.status",
          count: 1,
        },
      },

      // Sort by type and status
      {
        $sort: { type: 1, status: 1 },
      },
    ]);

    // Group by camera
    const byCameraStats = await Alert.aggregate([
      ...(req.query.startDate || req.query.endDate
        ? [
            {
              $match: {
                timestamp: {
                  ...(req.query.startDate && {
                    $gte: new Date(req.query.startDate),
                  }),
                  ...(req.query.endDate && {
                    $lte: new Date(req.query.endDate),
                  }),
                },
              },
            },
          ]
        : []),
      {
        $group: {
          _id: "$cameraId",
          count: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ["$status", "active"] }, 1, 0],
            },
          },
          resolved: {
            $sum: {
              $cond: [{ $eq: ["$status", "resolved"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          cameraId: "$_id",
          count: 1,
          active: 1,
          resolved: 1,
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        byTypeAndStatus: stats,
        byCamera: byCameraStats,
      },
    });
  } catch (err) {
    next(err);
  }
};
