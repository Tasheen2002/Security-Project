// Role-based authorization middleware
import validateTokenViaUserinfo from "./auth0-userinfo.js";

// Admin email whitelist - replace with actual admin emails
const ADMIN_EMAILS = [
  'admin@example.com', 
  'your-email@gmail.com'  // Replace with your actual email
];

// Check if user has admin role
const checkAdminRole = (userAuth) => {
  // Check Auth0 roles
  const roles = userAuth['https://yourapp.com/roles'] || [];
  const hasAdminRole = roles.includes('admin');
  
  // Check email whitelist as fallback
  const isAdminByEmail = ADMIN_EMAILS.includes(userAuth.email);
  
  return hasAdminRole || isAdminByEmail;
};

// Middleware that requires authentication only
export const requireAuth = validateTokenViaUserinfo;

// Middleware that requires admin privileges
export const requireAdmin = async (req, res, next) => {
  // First validate the token
  validateTokenViaUserinfo(req, res, (err) => {
    if (err) return next(err);
    
    // Then check admin privileges
    const isAdmin = checkAdminRole(req.auth);
    
    if (!isAdmin) {
      console.log('Admin access denied. User:', req.auth.email || req.auth.sub);
      return res.status(403).json({ 
        message: "Forbidden - Admin access required",
        userRole: "user" 
      });
    }
    
    console.log('Admin access granted. User:', req.auth.email || req.auth.sub);
    next();
  });
};

// Middleware that allows both users and admins but adds role info
export const requireAuthWithRole = async (req, res, next) => {
  // First validate the token
  validateTokenViaUserinfo(req, res, (err) => {
    if (err) return next(err);
    
    // Add role information to request
    req.userRole = checkAdminRole(req.auth) ? 'admin' : 'user';
    console.log(`Access granted. User: ${req.auth.email || req.auth.sub}, Role: ${req.userRole}`);
    next();
  });
};