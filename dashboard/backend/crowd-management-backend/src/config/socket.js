// src/config/socket.js
const jwt = require("jsonwebtoken");

const setupSocketHandlers = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user to their specific room
    socket.join(`user-${socket.userId}`);

    // Join admin users to admin room for alerts
    if (socket.userRole === "admin") {
      socket.join("admin-alerts");
    }

    // Handle subscription to specific camera alerts
    socket.on("subscribe-camera", (cameraId) => {
      socket.join(`camera-${cameraId}`);
      console.log(`User ${socket.userId} subscribed to camera ${cameraId}`);
    });

    socket.on("unsubscribe-camera", (cameraId) => {
      socket.leave(`camera-${cameraId}`);
      console.log(`User ${socket.userId} unsubscribed from camera ${cameraId}`);
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

module.exports = setupSocketHandlers;
