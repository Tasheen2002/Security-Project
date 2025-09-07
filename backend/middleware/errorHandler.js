// middleware/errorHandler.js
// Centralized error handling middleware

export default function errorHandler(err, req, res, next) {
  console.error(err.stack);
  // Avoid leaking sensitive error details
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
}
