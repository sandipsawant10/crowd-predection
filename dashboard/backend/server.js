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
const path = require("path");
const result = dotenv.config({ path: path.resolve(__dirname, ".env") });
if (result.error) {
  console.error("Error loading .env file:", result.error);
  console.error("Current directory:", __dirname);
  console.error("Trying to load .env from:", path.resolve(__dirname, ".env"));
} else {
  console.log(".env file loaded successfully");
  console.log(
    "Environment variables loaded:",
    Object.keys(process.env).filter((key) => !key.startsWith("npm_")).length
  );
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("MONGODB_URI exists:", !!process.env.MONGODB_URI);
}

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
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests from this IP, please try again later.",
    });
  },
});

// Middleware
app.use(helmet()); // Security headers
// Fix and clean up the ALLOWED_ORIGINS value by removing any newlines or spaces
const cleanedAllowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.replace(/\r?\n|\r/g, "")
      .split(",")
      .map((origin) => origin.trim())
  : ["http://localhost:3000"];

console.log("Allowed Origins:", cleanedAllowedOrigins);

// Configure CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);

    // Check if origin is allowed
    if (cleanedAllowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log("Origin not allowed by CORS:", origin);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Remove routine HTTP request logging
// app.use(morgan("combined")); // Logging removed
app.use("/api", limiter); // Apply rate limiting to all API routes

// Health check endpoint with explicit CORS handling
app.options("/health", cors(corsOptions)); // Enable preflight for health endpoint
app.get("/health", cors(corsOptions), (req, res) => {
  // Health check endpoint, no logging
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    corsEnabled: true,
    allowedOrigins: cleanedAllowedOrigins,
  });
});

// Handle favicon.ico request
app.get("/favicon.ico", (req, res) => {
  res.status(204).send(); // No content response for favicon
});

// API Routes
// API Routes with custom logging for important events
app.use(
  "/api/auth",
  (req, res, next) => {
    // Only log login/logout events
    if (req.method === "POST" && req.originalUrl.endsWith("/login")) {
      console.log(
        `[IMPORTANT] Auth login attempt for user: ${
          req.body?.username || "unknown"
        }`
      );
    }
    next();
  },
  authRoutes
);

app.use(
  "/api/crowd",
  (req, res, next) => {
    // Only log prediction events
    if (req.method === "POST" && req.originalUrl.includes("/predict")) {
      console.log(`[IMPORTANT] Crowd prediction requested:`, req.body);
    }
    next();
  },
  crowdRoutes
);

app.use(
  "/api/alerts",
  (req, res, next) => {
    // Only log alert creation
    if (req.method === "POST") {
      console.log(`[IMPORTANT] Alert created:`, req.body);
    }
    next();
  },
  alertRoutes
);

app.use("/api/cameras", cameraRoutes); // No important logs needed

app.use(
  "/api/actions",
  (req, res, next) => {
    // Only log action events
    if (req.method === "POST") {
      console.log(`[IMPORTANT] Action performed:`, req.body);
    }
    next();
  },
  actionRoutes
);

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
