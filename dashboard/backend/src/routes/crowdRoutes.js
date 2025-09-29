// src/routes/crowdRoutes.js
const express = require("express");
const router = express.Router();
const crowdController = require("../controllers/crowdController");
const { protect, authorize, optionalAuth } = require("../middleware/auth");
const {
  validate,
  validateCrowdData,
  validateCrowdHistory,
  validatePagination,
} = require("../middleware/validation");

// Submit new crowd data - protected route
router.post(
  "/",
  protect,
  validateCrowdData,
  validate,
  crowdController.submitCrowdData
);

// Get latest crowd data - public route with optional auth
router.get("/latest", optionalAuth, crowdController.getLatestCrowdData);

// Get crowd history - public route with optional auth
router.get(
  "/history",
  optionalAuth,
  validateCrowdHistory,
  validate,
  crowdController.getCrowdHistory
);

// Get crowd statistics - public route with optional auth
router.get("/stats", optionalAuth, crowdController.getCrowdStats);

// Delete crowd data - admin only
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  crowdController.deleteCrowdData
);

module.exports = router;
