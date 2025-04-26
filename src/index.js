import { fileURLToPath } from "url";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs"; // Add this import

// Debugging - show current directory and files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log("Current directory:", __dirname);
console.log("Files in directory:", fs.readdirSync(__dirname));

// Try multiple possible .env paths
const envPaths = [
  path.resolve(__dirname, ".env"), // Same directory
  path.resolve(__dirname, "../.env"), // One level up
  path.resolve(__dirname, "../../.env"), // Two levels up
];

let envPathUsed = null;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    envPathUsed = envPath;
    break;
  }
}

if (!envPathUsed) {
  console.error("❌ No .env file found at any of these locations:");
  console.error(envPaths);
  process.exit(1);
}

console.log(`✅ Found .env at: ${envPathUsed}`);
const result = dotenv.config({ path: envPathUsed });

if (result.error) {
  console.error("❌ Error loading .env:", result.error);
  process.exit(1);
}

// Show loaded variables (mask sensitive ones)
console.log("Loaded environment variables:", {
  PORT: process.env.PORT,
  MONGODB_URI: process.env.MONGODB_URI ? "*****" : "MISSING",
  CLOUDINARY: process.env.CLOUDINARY_CLOUD_NAME ? "CONFIGURED" : "MISSING",
});
// Import app and database connection after env is configured
import DbConnect from "./db/index.js";
import app from "./app.js";

const PORT = process.env.PORT || 3000;

// Enhanced database connection with retry logic
const connectWithRetry = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB connected successfully");
    return true;
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.log("⌛ Retrying connection in 5 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return connectWithRetry();
  }
};

// Database connection and server startup
connectWithRetry()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🛜 CORS configured for: ${process.env.CORS_ORIGIN}`);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("🛑 SIGTERM received - shutting down gracefully");
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log("🛑 Server and database connections closed");
          process.exit(0);
        });
      });
    });
  })
  .catch((err) => {
    console.error("❌ Fatal startup error:", err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err.message);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err.message);
  process.exit(1);
});
