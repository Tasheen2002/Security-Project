// middleware/securityLogger.js
// Logs security-related events

export default function securityLogger(req, res, next) {
  // Example: log login attempts, failed validations, etc.
  if (req.path.includes("/auth") || req.path.includes("/login")) {
    console.log(
      `[SECURITY] Auth event: ${req.method} ${req.path} from ${req.ip}`
    );
  }
  next();
}
