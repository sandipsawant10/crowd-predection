// src/middleware/validation.js
const { validationResult, body, param, query } = require("express-validator");

/**
 * Middleware to check validation results
 */
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

/**
 * Validation rules for crowd data submission
 */
exports.validateCrowdData = [
  body("cameraId")
    .notEmpty()
    .withMessage("Camera ID is required")
    .isString()
    .withMessage("Camera ID must be a string"),

  body("timestamp")
    .optional()
    .isISO8601()
    .withMessage("Timestamp must be a valid ISO8601 date string"),

  body("count")
    .notEmpty()
    .withMessage("Crowd count is required")
    .isInt({ min: 0 })
    .withMessage("Crowd count must be a non-negative integer"),

  body("prediction")
    .notEmpty()
    .withMessage("Prediction array is required")
    .isArray({ min: 6, max: 6 })
    .withMessage("Prediction must contain exactly 6 values")
    .custom((arr) => arr.every((val) => !isNaN(val) && val >= 0))
    .withMessage("Prediction values must be non-negative numbers"),

  body("alertTriggered")
    .optional()
    .isBoolean()
    .withMessage("Alert triggered must be a boolean value"),
];

/**
 * Validation rules for alert creation
 */
exports.validateAlert = [
  body("cameraId")
    .notEmpty()
    .withMessage("Camera ID is required")
    .isString()
    .withMessage("Camera ID must be a string"),

  body("timestamp")
    .optional()
    .isISO8601()
    .withMessage("Timestamp must be a valid ISO8601 date string"),

  body("type")
    .notEmpty()
    .withMessage("Alert type is required")
    .isIn([
      "HighCrowd",
      "RapidIncrease",
      "SecurityBreach",
      "SystemFailure",
      "Other",
    ])
    .withMessage("Invalid alert type"),

  body("message")
    .notEmpty()
    .withMessage("Alert message is required")
    .isString()
    .withMessage("Alert message must be a string"),

  body("triggeredBy")
    .notEmpty()
    .withMessage("Trigger source is required")
    .isIn(["system", "admin"])
    .withMessage("Invalid trigger source"),
];

/**
 * Validation rules for camera registration
 */
exports.validateCamera = [
  body("cameraId")
    .notEmpty()
    .withMessage("Camera ID is required")
    .isString()
    .withMessage("Camera ID must be a string"),

  body("location")
    .notEmpty()
    .withMessage("Location is required")
    .isString()
    .withMessage("Location must be a string"),

  body("status")
    .optional()
    .isIn(["active", "inactive", "maintenance", "offline"])
    .withMessage("Invalid camera status"),

  body("maxCapacity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Maximum capacity must be a non-negative integer"),

  body("alertThreshold")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Alert threshold must be a non-negative integer")
    .custom((value, { req }) => {
      if (req.body.maxCapacity && value > req.body.maxCapacity) {
        throw new Error("Alert threshold cannot exceed maximum capacity");
      }
      return true;
    }),
];

/**
 * Validation rules for action recording
 */
exports.validateAction = [
  body("action")
    .notEmpty()
    .withMessage("Action type is required")
    .isString()
    .withMessage("Action type must be a string"),

  body("cameraId")
    .notEmpty()
    .withMessage("Camera ID is required")
    .isString()
    .withMessage("Camera ID must be a string"),

  body("timestamp")
    .optional()
    .isISO8601()
    .withMessage("Timestamp must be a valid ISO8601 date string"),

  body("performedBy").optional(),

  body("details").optional().isString().withMessage("Details must be a string"),
];

/**
 * Validation rules for user registration
 */
exports.validateUserRegistration = [
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .trim(),

  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  body("role")
    .optional()
    .isIn(["admin", "operator", "viewer"])
    .withMessage("Invalid role"),
];

/**
 * Validation rules for user login
 */
exports.validateLogin = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address"),

  body("password").notEmpty().withMessage("Password is required"),
];

/**
 * Validation for pagination parameters
 */
exports.validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];

/**
 * Validation for crowd history parameters
 */
exports.validateCrowdHistory = [
  query("cameraId").notEmpty().withMessage("Camera ID is required"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage("Limit must be between 1 and 1000"),

  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO8601 date string"),

  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO8601 date string"),
];
