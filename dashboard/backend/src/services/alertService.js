// src/services/alertService.js
const Alert = require("../models/Alert");

/**
 * Service for handling alerts
 */
const alertService = {
  /**
   * Create a new alert and emit via socket if io is provided
   * @param {Object} alertData - Alert data object
   * @param {Object} io - Socket.io instance (optional)
   * @returns {Promise<Object>} Created alert
   */
  async createAlert(alertData, io = null) {
    try {
      const alert = await Alert.create(alertData);

      // If socket.io instance provided, emit the alert
      if (io) {
        // Emit to all admins
        io.to("admin-alerts").emit("new-alert", alert);

        // NOTE: Camera room emission removed - use general alert room for file-based system
        io.to("results-updates").emit("new-alert", alert);
      }

      return alert;
    } catch (error) {
      console.error("Error creating alert:", error);
      throw error;
    }
  },

  /**
   * Get active alerts
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} Array of alerts
   */
  async getActiveAlerts(filters = {}) {
    try {
      const query = { status: "active", ...filters };
      return await Alert.find(query).sort({ timestamp: -1 });
    } catch (error) {
      console.error("Error fetching active alerts:", error);
      throw error;
    }
  },

  /**
   * Update alert status
   * @param {String} alertId - Alert ID
   * @param {String} status - New status ('acknowledged' or 'resolved')
   * @param {Object} userData - User data who updated the status
   * @returns {Promise<Object>} Updated alert
   */
  async updateAlertStatus(alertId, status, userData) {
    try {
      const updateData = { status };

      if (status === "acknowledged") {
        updateData.acknowledgedBy = userData.id;
        updateData.acknowledgedAt = Date.now();
      } else if (status === "resolved") {
        updateData.resolvedBy = userData.id;
        updateData.resolvedAt = Date.now();
      }

      const alert = await Alert.findByIdAndUpdate(alertId, updateData, {
        new: true,
        runValidators: true,
      });

      return alert;
    } catch (error) {
      console.error("Error updating alert status:", error);
      throw error;
    }
  },
};

module.exports = alertService;
