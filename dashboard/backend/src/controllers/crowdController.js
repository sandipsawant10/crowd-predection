// src/controllers/crowdController.js
// NOTE: This controller provides legacy compatibility but is not needed
// in the new file-based system. Consider removing if not used.
const Crowd = require("../models/Crowd");
const Alert = require("../models/Alert");
const alertService = require("../services/alertService");

/**
 * @desc    Submit new crowd data
 * @route   POST /api/crowd
 * @access  Private
 */
exports.submitCrowdData = async (req, res, next) => {
  try {
    // NOTE: This endpoint is legacy and not used in file-based system
    // Consider removing if not needed for backward compatibility
    res.status(501).json({
      success: false,
      message: "Legacy endpoint - use file-based system instead",
      redirect: "/api/results/files",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get latest crowd data (Legacy - redirects to file-based system)
 * @route   GET /api/crowd/latest
 * @access  Public
 */
exports.getLatestCrowdData = async (req, res, next) => {
  try {
    // NOTE: Legacy endpoint - redirects to file-based system
    res.status(200).json({
      success: true,
      count: 0,
      data: [],
      message: "Legacy endpoint - use /api/results/files for latest file data",
      redirect: "/api/results/files",
    });
  } catch (err) {
    console.error("Error in getLatestCrowdData:", err);
    // Return empty data instead of throwing error to prevent dashboard crashes
    res.status(200).json({
      success: true,
      count: 0,
      data: [],
      message: "Legacy endpoint not available in file-based system",
    });
  }
};

/**
 * @desc    Get crowd data history (Legacy - redirects to file-based system)
 * @route   GET /api/crowd/history
 * @access  Public
 */
exports.getCrowdHistory = async (req, res, next) => {
  try {
    // NOTE: Legacy endpoint - redirects to file-based system
    res.status(200).json({
      success: true,
      count: 0,
      data: [],
      message: "Legacy endpoint - use /api/results/files for file-based data",
      redirect: "/api/results/files",
    });
  } catch (err) {
    console.error("Error in getCrowdHistory:", err);
    res.status(200).json({
      success: true,
      count: 0,
      data: [],
      message: "Legacy endpoint not available in file-based system",
    });
  }
};

/**
 * @desc    Get crowd statistics (Legacy - redirects to file-based system)
 * @route   GET /api/crowd/stats
 * @access  Public
 */
exports.getCrowdStats = async (req, res, next) => {
  try {
    // NOTE: Legacy endpoint - redirects to file-based system
    res.status(200).json({
      success: true,
      count: 0,
      data: [],
      message:
        "Legacy endpoint - use /api/results/files for file-based statistics",
      redirect: "/api/results/files",
    });
  } catch (err) {
    console.error("Error in getCrowdStats:", err);
    res.status(500).json({
      success: false,
      message: "Legacy endpoint not available in file-based system",
    });
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
