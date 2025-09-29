// src/controllers/actionController.js
const Action = require("../models/Action");
const Camera = require("../models/Camera");
const Alert = require("../models/Alert");

/**
 * @desc    Record a new action
 * @route   POST /api/actions
 * @access  Private
 */
exports.recordAction = async (req, res, next) => {
  try {
    const {
      action,
      cameraId,
      timestamp,
      details,
      relatedAlertId,
      crowdCountBefore,
    } = req.body;

    // Check if camera exists
    const camera = await Camera.findOne({ cameraId });

    if (!camera) {
      return res.status(404).json({
        success: false,
        message: `Camera with ID ${cameraId} not found`,
      });
    }

    // Check if related alert exists if provided
    if (relatedAlertId) {
      const alert = await Alert.findById(relatedAlertId);

      if (!alert) {
        return res.status(404).json({
          success: false,
          message: "Related alert not found",
        });
      }
    }

    // Create action record
    const actionRecord = await Action.create({
      action,
      cameraId,
      timestamp: timestamp || Date.now(),
      performedBy: req.user._id,
      performedByUsername: req.user.username,
      details,
      relatedAlertId,
      crowdCountBefore,
      status: "completed",
    });

    // Notify connected clients
    const io = req.app.get("io");
    if (io) {
      io.to(`camera-${cameraId}`).emit("new-action", actionRecord);
      io.to("admin-alerts").emit("new-action", actionRecord);
    }

    res.status(201).json({
      success: true,
      data: actionRecord,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all actions
 * @route   GET /api/actions
 * @access  Private
 */
exports.getActions = async (req, res, next) => {
  try {
    // Build query from filters
    const query = {};

    // Filter by camera ID
    if (req.query.cameraId) {
      query.cameraId = req.query.cameraId;
    }

    // Filter by action type
    if (req.query.action) {
      query.action = req.query.action;
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by user who performed the action
    if (req.query.performedBy) {
      query.performedBy = req.query.performedBy;
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

    // Get actions
    const actions = await Action.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate("performedBy", "username");

    // Get total count for pagination
    const totalActions = await Action.countDocuments(query);

    res.status(200).json({
      success: true,
      count: actions.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalActions / limit),
        total: totalActions,
      },
      data: actions,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get a single action
 * @route   GET /api/actions/:id
 * @access  Private
 */
exports.getAction = async (req, res, next) => {
  try {
    const action = await Action.findById(req.params.id).populate(
      "performedBy",
      "username"
    );

    if (!action) {
      return res.status(404).json({
        success: false,
        message: "Action not found",
      });
    }

    res.status(200).json({
      success: true,
      data: action,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update action status and effectiveness
 * @route   PUT /api/actions/:id
 * @access  Private
 */
exports.updateAction = async (req, res, next) => {
  try {
    const { status, effectivenessRating, crowdCountAfter } = req.body;

    // Fields to update
    const updateFields = {};
    if (status) updateFields.status = status;
    if (effectivenessRating)
      updateFields.effectivenessRating = effectivenessRating;
    if (crowdCountAfter !== undefined)
      updateFields.crowdCountAfter = crowdCountAfter;

    // Update action
    const action = await Action.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!action) {
      return res.status(404).json({
        success: false,
        message: "Action not found",
      });
    }

    res.status(200).json({
      success: true,
      data: action,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete an action
 * @route   DELETE /api/actions/:id
 * @access  Private/Admin
 */
exports.deleteAction = async (req, res, next) => {
  try {
    const action = await Action.findById(req.params.id);

    if (!action) {
      return res.status(404).json({
        success: false,
        message: "Action not found",
      });
    }

    // Check if user has permission (admin or the user who created the action)
    if (
      req.user.role !== "admin" &&
      action.performedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this action",
      });
    }

    await action.deleteOne();

    res.status(200).json({
      success: true,
      message: "Action deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get action statistics
 * @route   GET /api/actions/stats
 * @access  Private
 */
exports.getActionStats = async (req, res, next) => {
  try {
    // Get action counts by type
    const actionsByType = await Action.aggregate([
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
          _id: "$action",
          count: { $sum: 1 },
          avgEffectiveness: { $avg: "$effectivenessRating" },
        },
      },
      {
        $project: {
          _id: 0,
          action: "$_id",
          count: 1,
          avgEffectiveness: { $round: ["$avgEffectiveness", 2] },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Get action counts by user
    const actionsByUser = await Action.aggregate([
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
          _id: "$performedByUsername",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          username: "$_id",
          count: 1,
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Get actions that had significant impact (effectiveness rating >= 4)
    const effectiveActions = await Action.aggregate([
      {
        $match: {
          effectivenessRating: { $gte: 4 },
        },
      },
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 },
          avgEffectiveness: { $avg: "$effectivenessRating" },
        },
      },
      {
        $project: {
          _id: 0,
          action: "$_id",
          count: 1,
          avgEffectiveness: { $round: ["$avgEffectiveness", 2] },
        },
      },
      {
        $sort: { avgEffectiveness: -1, count: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        byType: actionsByType,
        byUser: actionsByUser,
        effectiveActions: effectiveActions,
      },
    });
  } catch (err) {
    next(err);
  }
};
