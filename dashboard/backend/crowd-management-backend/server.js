// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const { createServer } = require("http");
const { Server } = require("socket.io");
const rateLimit = require("express-rate-limit");

// Load environment variables
dotenv.config();

// Import database configuration
const connectDB = require("./src/config/database");

// Import routes
const authRoutes = require("./src/routes/authRoutes");
const crowdRoutes = require("./src/routes/crowdRoutes");
const alertRoutes = require("./src/routes/alertRoutes");
const cameraRoutes = require("./src/routes/cameraRoutes");
const actionRoutes = require("./src/routes/actionRoutes");

// Import middleware
const errorHandler = require("./src/middleware/errorHandler");

// Import socket configuration
const setupSocketHandlers = require("./src/config/socket");

// Initialize express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
    credentials: true,
  },
});

// Connect to MongoDB
connectDB();

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: "Too many requests from this IP, please try again later.",
});

// Middleware
app.use(helmet()); // Security headers
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined")); // Logging
app.use("/api", limiter); // Apply rate limiting to all API routes

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/crowd", crowdRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/cameras", cameraRoutes);
app.use("/api/actions", actionRoutes);

// Setup Socket.io handlers
setupSocketHandlers(io);

// Make io accessible to routes
app.set("io", io);

// Error handling middleware (must be last)
app.use(errorHandler);

// Handle 404
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! Shutting down...");
  console.error(err.name, err.message);
  httpServer.close(() => {
    process.exit(1);
  });
});

module.exports = app;
