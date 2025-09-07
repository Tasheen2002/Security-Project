// Debug utility to decode JWT tokens for troubleshooting
export function decodeJwt(token) {
  if (!token) {
    console.log("No token provided");
    return null;
  }

  try {
    // Split the token into parts
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.log(
        "Invalid token format - should have 3 parts separated by dots"
      );
      return null;
    }

    // Decode the header and payload (base64url)
    const header = JSON.parse(
      atob(parts[0].replace(/-/g, "+").replace(/_/g, "/"))
    );
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    );

    console.log("JWT Header:", header);
    console.log("JWT Payload:", payload);
    console.log("JWT Audience:", payload.aud);
    console.log("JWT Issuer:", payload.iss);
    console.log("JWT Subject:", payload.sub);
    console.log("JWT Expires:", new Date(payload.exp * 1000));

    return { header, payload };
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
}
