// middleware/auth0.js
// Middleware to validate Auth0 JWT access tokens
import { expressjwt } from "express-jwt";
import jwksRsa from "jwks-rsa";
import { auth0 } from "../config/env.js";

const checkJwt = expressjwt({
  // Dynamically provide a signing key based on the kid in the header and the signing keys provided by the JWKS endpoint.
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${auth0.domain}/.well-known/jwks.json`,
  }),

  // Skip audience validation since we don't have a registered API in Auth0
  // audience: auth0.audience, // Commented out - API not registered in Auth0 tenant
  issuer: `https://${auth0.domain}/`,
  algorithms: ["RS256"],
});

// Wrap checkJwt with debugging
const debugCheckJwt = (req, res, next) => {
  console.log("🔐 Auth0 middleware called");
  console.log("Authorization header:", req.headers.authorization);

  checkJwt(req, res, (err) => {
    if (err) {
      console.error("❌ JWT validation failed:", err.message);
      console.error("Error details:", err);
      return res.status(401).json({
        message: "Invalid or missing authentication token",
        error: err.message,
      });
    }

    console.log("✅ JWT validation successful");
    console.log("User info:", req.auth);
    next();
  });
};

export default debugCheckJwt;
