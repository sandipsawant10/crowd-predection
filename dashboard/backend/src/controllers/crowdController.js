// src/controllers/crowdController.js
const Crowd = require("../models/Crowd");
const Camera = require("../models/Camera");
const Alert = require("../models/Alert");
const alertService = require("../services/alertService");

/**
 * @desc    Submit new crowd data
 * @route   POST /api/crowd
 * @access  Private
 */
exports.submitCrowdData = async (req, res, next) => {
  try {
    const { cameraId, timestamp, count, prediction, alertTriggered } = req.body;

    // Calculate density level based on count
    let density = "low";
    const camera = await Camera.findOne({ cameraId });

    if (camera) {
      // Update camera's last update time
      camera.lastUpdate = Date.now();
      await camera.save();

      // Calculate density based on camera capacity
      const percentage = (count / camera.maxCapacity) * 100;

      if (percentage >= 80) density = "critical";
      else if (percentage >= 60) density = "high";
      else if (percentage >= 30) density = "medium";

      // Check if count exceeds threshold and alertTriggered is true
      if (count >= camera.alertThreshold && alertTriggered) {
        // Create an alert through the service
        await alertService.createAlert(
          {
            cameraId,
            timestamp: timestamp || Date.now(),
            type: "HighCrowd",
            message: `Crowd count (${count}) exceeds threshold at ${camera.location}`,
            triggeredBy: "system",
            crowdCount: count,
          },
          req.app.get("io")
        );
      }
    }

    // Create new crowd data entry
    const crowdData = await Crowd.create({
      cameraId,
      timestamp: timestamp || Date.now(),
      count,
      prediction,
      alertTriggered,
      density,
    });

    res.status(201).json({
      success: true,
      data: crowdData,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get latest crowd data for each camera
 * @route   GET /api/crowd/latest
 * @access  Public
 */
exports.getLatestCrowdData = async (req, res, next) => {
  try {
    const { cameraId } = req.query;
    let latestData;

    // If cameraId is provided, get latest for specific camera
    if (cameraId) {
      latestData = await Crowd.findOne({ cameraId }).sort({ timestamp: -1 });

      if (!latestData) {
        return res.status(404).json({
          success: false,
          message: `No crowd data found for camera ${cameraId}`,
        });
      }
    }
    // Otherwise, get latest for all cameras
    else {
      latestData = await Crowd.getLatestForAllCameras();
    }

    res.status(200).json({
      success: true,
      count: Array.isArray(latestData) ? latestData.length : 1,
      data: latestData,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get crowd data history for a specific camera
 * @route   GET /api/crowd/history
 * @access  Public
 */
exports.getCrowdHistory = async (req, res, next) => {
  try {
    const { cameraId, limit = 100, startDate, endDate } = req.query;

    // Build query
    const query = { cameraId };

    // Add date range if provided
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Get history
    const history = await Crowd.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get crowd statistics for a specific camera
 * @route   GET /api/crowd/stats
 * @access  Public
 */
exports.getCrowdStats = async (req, res, next) => {
  try {
    const { cameraId, period = "day" } = req.query;

    let timeField;
    let format;

    // Determine time grouping based on period
    switch (period) {
      case "hour":
        timeField = { hour: { $hour: "$timestamp" } };
        format = "%H:00";
        break;
      case "day":
        timeField = {
          day: { $dayOfMonth: "$timestamp" },
          month: { $month: "$timestamp" },
          year: { $year: "$timestamp" },
        };
        format = "%Y-%m-%d";
        break;
      case "week":
        timeField = {
          week: { $week: "$timestamp" },
          year: { $year: "$timestamp" },
        };
        format = "Week %U, %Y";
        break;
      case "month":
        timeField = {
          month: { $month: "$timestamp" },
          year: { $year: "$timestamp" },
        };
        format = "%Y-%m";
        break;
      default:
        timeField = {
          day: { $dayOfMonth: "$timestamp" },
          month: { $month: "$timestamp" },
          year: { $year: "$timestamp" },
        };
        format = "%Y-%m-%d";
    }

    // Get aggregated stats
    const stats = await Crowd.aggregate([
      { $match: { cameraId } },
      {
        $group: {
          _id: timeField,
          avgCount: { $avg: "$count" },
          maxCount: { $max: "$count" },
          minCount: { $min: "$count" },
          totalEntries: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": -1,
          "_id.month": -1,
          "_id.day": -1,
          "_id.hour": -1,
          "_id.week": -1,
        },
      },
      {
        $project: {
          _id: 0,
          period: { $dateToString: { format, date: "$_id" } },
          avgCount: { $round: ["$avgCount", 2] },
          maxCount: 1,
          minCount: 1,
          totalEntries: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: stats.length,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete crowd data (admin only)
 * @route   DELETE /api/crowd/:id
 * @access  Private/Admin
 */
exports.deleteCrowdData = async (req, res, next) => {
  try {
    const crowdData = await Crowd.findById(req.params.id);

    if (!crowdData) {
      return res.status(404).json({
        success: false,
        message: "Crowd data not found",
      });
    }

    await crowdData.deleteOne();

    res.status(200).json({
      success: true,
      message: "Crowd data deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};
