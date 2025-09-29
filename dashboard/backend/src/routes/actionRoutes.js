// src/routes/actionRoutes.js
const express = require("express");
const router = express.Router();
const actionController = require("../controllers/actionController");
const { protect, authorize } = require("../middleware/auth");
const {
  validate,
  validateAction,
  validatePagination,
} = require("../middleware/validation");

// Record a new action - protected route
router.post(
  "/",
  protect,
  validateAction,
  validate,
  actionController.recordAction
);

// Get all actions - protected route
router.get(
  "/",
  protect,
  validatePagination,
  validate,
  actionController.getActions
);

// Get action statistics - protected route
router.get("/stats", protect, actionController.getActionStats);

// Get a single action - protected route
router.get("/:id", protect, actionController.getAction);

// Update an action - protected route (only for status, effectiveness rating)
router.put("/:id", protect, actionController.updateAction);

// Delete an action - admin or creator only
router.delete("/:id", protect, actionController.deleteAction);

module.exports = router;
