// src/controllers/cameraController.js
const Camera = require("../../../crowd-management-backend/src/models/Camera");
const cameraService = require("../../../crowd-management-backend/src/services/cameraService");

/**
 * @desc    Register a new camera
 * @route   POST /api/cameras
 * @access  Private/Admin
 */
exports.registerCamera = async (req, res, next) => {
  try {
    const {
      cameraId,
      location,
      status,
      maxCapacity,
      alertThreshold,
      description,
      ipAddress,
      coordinates,
    } = req.body;

    // Check if camera already exists
    const existingCamera = await Camera.findOne({ cameraId });

    if (existingCamera) {
      return res.status(400).json({
        success: false,
        message: `Camera with ID ${cameraId} already exists`,
      });
    }

    // Create new camera
    const camera = await Camera.create({
      cameraId,
      location,
      status,
      maxCapacity,
      alertThreshold,
      description,
      ipAddress,
      coordinates,
      lastUpdate: null, // Will be updated when data is received
    });

    res.status(201).json({
      success: true,
      data: camera,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all cameras
 * @route   GET /api/cameras
 * @access  Private
 */
exports.getCameras = async (req, res, next) => {
  try {
    // Get activity threshold from query params or default to 5 minutes
    const activityThreshold = parseInt(req.query.activityThreshold) || 5;

    // Get cameras with status
    const cameras = await cameraService.getAllCamerasWithStatus(
      activityThreshold
    );

    res.status(200).json({
      success: true,
      count: cameras.length,
      data: cameras,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get a single camera
 * @route   GET /api/cameras/:id
 * @access  Private
 */
exports.getCamera = async (req, res, next) => {
  try {
    const camera = await Camera.findById(req.params.id);

    if (!camera) {
      return res.status(404).json({
        success: false,
        message: "Camera not found",
      });
    }

    // Add active status
    const activityThreshold = parseInt(req.query.activityThreshold) || 5;
    const isActive = camera.isActive(activityThreshold);

    res.status(200).json({
      success: true,
      data: {
        ...camera.toObject(),
        active: isActive,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get a camera by cameraId
 * @route   GET /api/cameras/byId/:cameraId
 * @access  Private
 */
exports.getCameraByExternalId = async (req, res, next) => {
  try {
    const camera = await Camera.findOne({ cameraId: req.params.cameraId });

    if (!camera) {
      return res.status(404).json({
        success: false,
        message: "Camera not found",
      });
    }

    // Add active status
    const activityThreshold = parseInt(req.query.activityThreshold) || 5;
    const isActive = camera.isActive(activityThreshold);

    res.status(200).json({
      success: true,
      data: {
        ...camera.toObject(),
        active: isActive,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update a camera
 * @route   PUT /api/cameras/:id
 * @access  Private/Admin
 */
exports.updateCamera = async (req, res, next) => {
  try {
    const {
      location,
      status,
      maxCapacity,
      alertThreshold,
      description,
      ipAddress,
      coordinates,
    } = req.body;

    // Check if camera exists
    let camera = await Camera.findById(req.params.id);

    if (!camera) {
      return res.status(404).json({
        success: false,
        message: "Camera not found",
      });
    }

    // Fields to update
    const updateFields = {};
    if (location) updateFields.location = location;
    if (status) updateFields.status = status;
    if (maxCapacity !== undefined) updateFields.maxCapacity = maxCapacity;
    if (alertThreshold !== undefined)
      updateFields.alertThreshold = alertThreshold;
    if (description !== undefined) updateFields.description = description;
    if (ipAddress) updateFields.ipAddress = ipAddress;
    if (coordinates) updateFields.coordinates = coordinates;

    // Update camera
    camera = await Camera.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: camera,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a camera
 * @route   DELETE /api/cameras/:id
 * @access  Private/Admin
 */
exports.deleteCamera = async (req, res, next) => {
  try {
    const camera = await Camera.findById(req.params.id);

    if (!camera) {
      return res.status(404).json({
        success: false,
        message: "Camera not found",
      });
    }

    await camera.deleteOne();

    res.status(200).json({
      success: true,
      message: "Camera deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};
