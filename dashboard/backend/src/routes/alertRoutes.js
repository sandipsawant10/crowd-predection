// src/routes/alertRoutes.js
const express = require("express");
const router = express.Router();
const alertController = require("../controllers/alertController");
const { protect, authorize } = require("../middleware/auth");
const {
  validate,
  validateAlert,
  validatePagination,
} = require("../middleware/validation");

// Create a new alert - protected route
router.post("/", protect, validateAlert, validate, alertController.createAlert);

// Get all alerts with filters - protected route
router.get(
  "/",
  protect,
  validatePagination,
  validate,
  alertController.getAlerts
);

// Get alert statistics - protected route
router.get("/stats", protect, alertController.getAlertStats);

// Get a single alert - protected route
router.get("/:id", protect, alertController.getAlert);

// Update alert status - protected route
router.put("/:id/status", protect, alertController.updateAlertStatus);

// Delete an alert - admin only
router.delete("/:id", protect, authorize("admin"), alertController.deleteAlert);

module.exports = router;
