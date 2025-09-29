// src/services/cameraService.js
const Camera = require("../models/Camera");

/**
 * Service for handling camera operations
 */
const cameraService = {
  /**
   * Update camera status based on latest data
   * @param {String} cameraId - Camera ID
   * @returns {Promise<Object>} Updated camera
   */
  async updateCameraStatus(cameraId) {
    try {
      const camera = await Camera.findOne({ cameraId });

      if (!camera) {
        return null;
      }

      // Update last activity time
      camera.lastUpdate = Date.now();

      // Status is updated by pre-save hook
      await camera.save();

      return camera;
    } catch (error) {
      console.error("Error updating camera status:", error);
      throw error;
    }
  },

  /**
   * Get all cameras with status
   * @param {Number} minutesThreshold - Minutes threshold for active status
   * @returns {Promise<Array>} Array of cameras
   */
  async getAllCamerasWithStatus(minutesThreshold = 5) {
    try {
      const cameras = await Camera.find();

      // Add virtual property 'active' to each camera
      const camerasWithStatus = cameras.map((camera) => {
        const isActive = camera.isActive(minutesThreshold);
        return {
          ...camera.toObject(),
          active: isActive,
        };
      });

      return camerasWithStatus;
    } catch (error) {
      console.error("Error getting cameras with status:", error);
      throw error;
    }
  },
};

module.exports = cameraService;
