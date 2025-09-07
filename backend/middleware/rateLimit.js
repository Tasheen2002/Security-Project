// middleware/rateLimit.js
// Rate limiting middleware with memory leak protection

const rateLimitMap = new Map();
const WINDOW_SIZE = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 50; // Reduced from 100 for better security
const CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes cleanup interval
const MAX_IPS = 10000; // Prevent memory exhaustion

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  const keysToDelete = [];
  
  for (const [ip, timestamps] of rateLimitMap.entries()) {
    const validTimestamps = timestamps.filter(ts => now - ts < WINDOW_SIZE);
    if (validTimestamps.length === 0) {
      keysToDelete.push(ip);
    } else {
      rateLimitMap.set(ip, validTimestamps);
    }
  }
  
  keysToDelete.forEach(key => rateLimitMap.delete(key));
}, CLEANUP_INTERVAL);

function getClientIP(req) {
  // Get real IP with proper proxy header validation
  const forwarded = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  
  // Only trust proxy headers if trust proxy is enabled and from trusted sources
  if (req.app.get('trust proxy')) {
    if (forwarded) {
      // Take the first IP from x-forwarded-for chain
      const ips = forwarded.split(',').map(ip => ip.trim());
      return ips[0];
    }
    if (realIP) {
      return realIP;
    }
  }
  
  // Fallback to connection remote address
  return req.connection.remoteAddress || req.socket.remoteAddress || req.ip;
}

export default function rateLimit(req, res, next) {
  // Prevent memory exhaustion
  if (rateLimitMap.size > MAX_IPS) {
    // Clear oldest entries
    const entries = Array.from(rateLimitMap.entries()).slice(0, Math.floor(MAX_IPS / 2));
    rateLimitMap.clear();
    entries.forEach(([ip, timestamps]) => rateLimitMap.set(ip, timestamps));
  }

  const ip = getClientIP(req);
  const now = Date.now();
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }
  
  const timestamps = rateLimitMap
    .get(ip)
    .filter((ts) => now - ts < WINDOW_SIZE);
    
  if (timestamps.length >= MAX_REQUESTS) {
    return res
      .status(429)
      .json({ 
        error: "Too many requests. Please try again later.",
        retryAfter: Math.ceil(WINDOW_SIZE / 1000)
      });
  }
  
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  next();
}
