// src/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect, authorize } = require("../middleware/auth");
const {
  validate,
  validateUserRegistration,
  validateLogin,
} = require("../middleware/validation");

// Public routes
router.post(
  "/register",
  validateUserRegistration,
  validate,
  authController.register
);
router.post("/login", validateLogin, validate, authController.login);

// Protected routes (require authentication)
router.get("/me", protect, authController.getMe);
router.put("/me", protect, authController.updateProfile);
router.put("/change-password", protect, authController.changePassword);

// Admin routes (require admin role)
router.get("/users", protect, authorize("admin"), authController.getUsers);
router.get(
  "/users/:id",
  protect,
  authorize("admin"),
  authController.getUserById
);
router.put(
  "/users/:id",
  protect,
  authorize("admin"),
  authController.updateUser
);
router.delete(
  "/users/:id",
  protect,
  authorize("admin"),
  authController.deleteUser
);

module.exports = router;
