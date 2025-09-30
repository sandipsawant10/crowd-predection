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

// Create a new alert - demo mode (no auth required)
router.post("/", validateAlert, validate, alertController.createAlert);

// Get all alerts with filters - demo mode (no auth required)
router.get("/", validatePagination, validate, alertController.getAlerts);

// Get alert statistics - demo mode (no auth required)
router.get("/stats", alertController.getAlertStats);

// Get a single alert - demo mode (no auth required)
router.get("/:id", alertController.getAlert);

// Update alert status - demo mode (no auth required)
router.put("/:id/status", alertController.updateAlertStatus);

// Delete an alert - demo mode (no auth required)
router.delete("/:id", alertController.deleteAlert);

module.exports = router;
