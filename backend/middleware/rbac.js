export function requireRole(role) {
  return (req, res, next) => {
    // Updated to use req.auth instead of req.user (for Auth0 userinfo middleware)
    if (req.auth?.role !== role) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }
    next();
  };
}

export function checkRole(allowedRoles) {
  return (req, res, next) => {
    // Updated to use req.auth instead of req.user (for Auth0 userinfo middleware)
    const userRole = req.auth?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }
    next();
  };
}
