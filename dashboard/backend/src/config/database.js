// src/config/database.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log(
      "Attempting to connect to MongoDB with URI:",
      process.env.MONGODB_URI
    );

    if (!process.env.MONGODB_URI) {
      console.error("MONGODB_URI is undefined in environment variables");
      console.error("Environment variables:", Object.keys(process.env));
      throw new Error("MongoDB URI is undefined. Please check your .env file");
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected");
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
