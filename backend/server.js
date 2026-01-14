/**
 * ================================
 * Production Ready server.js
 * ================================
 */

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || "development";

/**
 * ================================
 * Middleware
 * ================================
 */

// CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server / curl / postman
      if (!origin) return callback(null, true);

      // Allow localhost during development
      if (
        NODE_ENV !== "production" &&
        (origin.startsWith("http://localhost") ||
          origin.startsWith("http://127.0.0.1"))
      ) {
        return callback(null, true);
      }

      // Allow frontend domain in production
      if (NODE_ENV === "production" && process.env.FRONTEND_URL) {
        if (origin === process.env.FRONTEND_URL) {
          return callback(null, true);
        }
      }

      return callback(
        new Error(`CORS blocked for origin: ${origin}`),
        false
      );
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false }));

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Request logging (only in development)
if (NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.originalUrl}`);
    next();
  });
}

/**
 * ================================
 * Health Check
 * ================================
 */
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "Backend is running",
    environment: NODE_ENV,
  });
});

/**
 * ================================
 * Routes
 * ================================
 */
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/topics", require("./routes/topicRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/submissions", require("./routes/submissionRoutes"));
app.use("/api/exams", require("./routes/examRoutes"));
app.use("/api/exam-submissions", require("./routes/resultRoutes"));
app.use("/api/student-performance", require("./routes/performanceRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/research", require("./routes/researchRoutes"));
app.use("/api/generate-questions", require("./routes/aiRoutes"));
app.use("/api/mock-exams", require("./routes/mockExamRoutes"));
app.use("/api/stats", require("./routes/statsRoutes"));

/**
 * ================================
 * 404 Handler
 * ================================
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/**
 * ================================
 * Global Error Handler
 * ================================
 */
app.use((err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: NODE_ENV === "production" ? undefined : err.stack,
  });
});

/**
 * ================================
 * Server Startup
 * ================================
 */
const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} (${NODE_ENV})`);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} already in use`);
        process.exit(1);
      }
      console.error(err);
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

/**
 * ================================
 * Process Safety
 * ================================
 */
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION 💥", err.message);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION 💥", err.message);
  process.exit(1);
});
