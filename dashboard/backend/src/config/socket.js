// src/config/socket.js
const jwt = require("jsonwebtoken");
const FileWatcherService = require("../services/fileWatcherService");

const setupSocketHandlers = (io) => {
  // Get fileWatcher instance
  const fileWatcher = FileWatcherService.instance;

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

  // Set up file watcher events for real-time updates (only if fileWatcher is available)
  if (fileWatcher && typeof fileWatcher.on === "function") {
    fileWatcher.on("fileChanged", (event) => {
      console.log(`[IMPORTANT] Broadcasting file change event:`, event);
      io.emit("fileUpdate", event);
    });
  } else {
    console.warn("FileWatcher not available for socket events");
  }

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user to their specific room
    socket.join(`user-${socket.userId}`);

    // Join admin users to admin room for alerts
    if (socket.userRole === "admin") {
      socket.join("admin-alerts");
    }

    // Send current file list to newly connected users
    socket.emit("fileList", {
      files: fileWatcher.getAvailableFiles(),
      timestamp: new Date(),
    });

    // NOTE: Camera subscription handlers removed - system now uses file-based monitoring

    // Handle file-related subscriptions
    socket.on("subscribe-results", () => {
      socket.join("results-updates");
      console.log(`User ${socket.userId} subscribed to result file updates`);
    });

    socket.on("unsubscribe-results", () => {
      socket.leave("results-updates");
      console.log(
        `User ${socket.userId} unsubscribed from result file updates`
      );
    });

    // Handle requests for latest file contents
    socket.on("get-latest-detection", async () => {
      try {
        const latestFile = fileWatcher.getLatestFile("detection");
        if (latestFile) {
          const contents = await fileWatcher.getFileContents(
            latestFile.filename
          );
          socket.emit("latestDetection", contents);
        } else {
          socket.emit("latestDetection", { error: "No detection files found" });
        }
      } catch (error) {
        socket.emit("latestDetection", { error: error.message });
      }
    });

    socket.on("get-latest-forecast", async () => {
      try {
        const latestFile = fileWatcher.getLatestFile("forecast");
        if (latestFile) {
          const contents = await fileWatcher.getFileContents(
            latestFile.filename
          );
          socket.emit("latestForecast", contents);
        } else {
          socket.emit("latestForecast", { error: "No forecast files found" });
        }
      } catch (error) {
        socket.emit("latestForecast", { error: error.message });
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

module.exports = setupSocketHandlers;
