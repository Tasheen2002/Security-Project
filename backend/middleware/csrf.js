// middleware/csrf.js
// CSRF protection middleware using double submit cookie pattern
import crypto from "crypto";
import { config } from "../config/env.js";

// Generate CSRF token
export function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

// CSRF protection middleware
export default function csrfProtection(req, res, next) {
  // Skip CSRF for GET, HEAD, OPTIONS requests (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  const token = req.headers["x-csrf-token"];
  const cookieToken = req.cookies ? req.cookies["csrfToken"] : null;
  
  if (!token || !cookieToken || token !== cookieToken) {
    return res.status(403).json({ 
      error: "Invalid CSRF token.",
      code: "CSRF_TOKEN_MISMATCH" 
    });
  }
  
  next();
}

// Endpoint to get CSRF token
export function getCSRFToken(req, res) {
  const token = generateCSRFToken();
  
  // Set secure cookie with CSRF token
  // Note: httpOnly must be false for double submit cookie pattern
  // The client needs to read this to include in request headers
  res.cookie('csrfToken', token, {
    httpOnly: false, // Required for client to read and include in headers
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/' // Ensure cookie is available for all paths
  });
  
  res.json({ csrfToken: token });
}
