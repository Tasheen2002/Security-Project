// Alternative Auth0 middleware that validates tokens via userinfo endpoint
// This works with both JWT and JWE tokens
import fetch from "node-fetch";
import { auth0 } from "../config/env.js";

const validateTokenViaUserinfo = async (req, res, next) => {
  console.log("🔐 Auth0 userinfo middleware called");

  const authHeader = req.headers.authorization;
  console.log("Authorization header:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("❌ No valid authorization header");
    return res.status(401).json({
      message: "Invalid or missing authentication token",
      error: "No Bearer token provided",
    });
  }

  const token = authHeader.split(" ")[1];
  console.log("Token extracted:", token ? "✓ Yes" : "✗ No");
  console.log("Token length:", token ? token.length : 0);

  try {
    // Validate token by calling Auth0's userinfo endpoint
    const userinfoResponse = await fetch(`https://${auth0.domain}/userinfo`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Userinfo response status:", userinfoResponse.status);

    if (!userinfoResponse.ok) {
      const errorText = await userinfoResponse.text();
      console.error("❌ Token validation failed:", errorText);
      return res.status(401).json({
        message: "Invalid or missing authentication token",
        error: "Token validation failed",
      });
    }

    const userInfo = await userinfoResponse.json();
    console.log("✅ Token validation successful");
    console.log("User info:", userInfo);

    // Add user info to request object
    req.auth = userInfo;
    next();
  } catch (error) {
    console.error("❌ Error validating token:", error.message);
    return res.status(401).json({
      message: "Invalid or missing authentication token",
      error: "Token validation error",
    });
  }
};

export default validateTokenViaUserinfo;
