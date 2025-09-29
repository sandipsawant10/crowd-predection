// src/routes/cameraRoutes.js
const express = require("express");
const router = express.Router();
const cameraController = require("../controllers/cameraController");
const { protect, authorize } = require("../middleware/auth");
const { validate, validateCamera } = require("../middleware/validation");

// Register a new camera - admin only
router.post(
  "/",
  protect,
  authorize("admin"),
  validateCamera,
  validate,
  cameraController.registerCamera
);

// Get all cameras - protected route
router.get("/", protect, cameraController.getCameras);

// Get a camera by ID (MongoDB ID) - protected route
router.get("/:id", protect, cameraController.getCamera);

// Get a camera by cameraId (external ID) - protected route
router.get("/byId/:cameraId", protect, cameraController.getCameraByExternalId);

// Update a camera - admin only
router.put("/:id", protect, authorize("admin"), cameraController.updateCamera);

// Delete a camera - admin only
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  cameraController.deleteCamera
);

module.exports = router;
