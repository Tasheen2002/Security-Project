import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { config } from "./config/env.js";
import rateLimit from "./middleware/rateLimit.js";
import csrfProtection, { getCSRFToken } from "./middleware/csrf.js";

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import purchaseRoutes from "./routes/purchases.js";
import userRoutes from "./routes/users.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/orders.js";

const app = express();

// Trust proxy (important for rate limiting and security)
app.set('trust proxy', 1);

// Middleware with secure request limits
app.use(express.json({ 
  limit: '1mb', // Reduced from 10mb to prevent DoS attacks
  strict: true,
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '1mb', // Reduced from 10mb to prevent DoS attacks
  parameterLimit: 100, // Limit number of parameters
  type: 'application/x-www-form-urlencoded'
}));
app.use(cookieParser());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true, // Allow credentials for CSRF protection
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
  })
);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    frameguard: { action: "deny" }, // X-Frame-Options: DENY
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
  })
);
app.use(morgan("combined"));

// Global rate limiting
app.use(rateLimit);

// CSRF token endpoint (public)
app.get("/api/csrf-token", getCSRFToken);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv 
  });
});

// Routes with CSRF protection
app.use("/api/auth", csrfProtection, authRoutes);
app.use("/api/products", csrfProtection, productRoutes);
app.use("/api/purchases", csrfProtection, purchaseRoutes);
app.use("/api/users", csrfProtection, userRoutes);
app.use("/api/cart", csrfProtection, cartRoutes);
app.use("/api/orders", csrfProtection, orderRoutes);

// JWT Error Handler
app.use((err, req, res, next) => {
  if (err.name === "UnauthorizedError") {
    // Only log in development, and don't expose sensitive headers
    if (config.nodeEnv === "development") {
      console.log("JWT Error:", {
        message: err.message,
        code: err.code,
        status: err.status,
      });
    }

    return res.status(401).json({
      error: "Authentication failed",
      message: "Invalid or missing authentication token",
      details: config.nodeEnv === "development" ? err.message : undefined,
    });
  }
  next(err);
});

// Global error handler
app.use((err, req, res, next) => {
  // Log error details (but not in production logs for security)
  if (config.nodeEnv === "development") {
    console.error("Unhandled Error:", {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
    });
  } else {
    // Log minimal info in production
    console.error("Application Error:", {
      message: err.message,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle specific error types
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: "Invalid JSON format",
      message: "Request body contains invalid JSON"
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: "Request too large",
      message: "Request body exceeds size limit"
    });
  }

  // Generic error response
  res.status(err.status || 500).json({
    error: "Internal server error",
    message: config.nodeEnv === "development" ? err.message : "Something went wrong",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
});

// Connect DB & start server
mongoose
  .connect(config.mongoUri)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(config.port, () =>
      console.log(`Server running on port ${config.port}`)
    );
  })
  .catch((err) => console.error(err));
