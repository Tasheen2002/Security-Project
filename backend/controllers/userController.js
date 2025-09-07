// controllers/userController.js
// Handles user profile info retrieval
import User from "../models/User.js";

export async function getUserProfile(req, res, next) {
  try {
    const requestedUsername = req.params.username;
    const currentUserId = req.user.id;
    
    // Authorization check: users can only access their own profile
    // or admins can access any profile
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    
    // Check if user is trying to access their own profile or is an admin
    if (currentUser.username !== requestedUsername && currentUser.role !== "admin") {
      return res.status(403).json({ 
        error: "Access denied. You can only access your own profile." 
      });
    }
    
    const user = await User.findOne({ username: requestedUsername });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Return user profile data (excluding sensitive fields)
    res.json({
      username: user.username,
      name: user.name,
      email: user.email,
      contactNumber: user.contactNumber,
      country: user.country,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (err) {
    next(err);
  }
}

export async function getCurrentUserProfile(req, res, next) {
  try {
    const currentUserId = req.user.id;
    
    const user = await User.findById(currentUserId).select('-password');
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({
      username: user.username,
      name: user.name,
      email: user.email,
      contactNumber: user.contactNumber,
      country: user.country,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUserProfile(req, res, next) {
  try {
    const currentUserId = req.user.id;
    const { name, email, contactNumber, country } = req.body;
    
    const user = await User.findByIdAndUpdate(
      currentUserId,
      { name, email, contactNumber, country },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({
      message: "Profile updated successfully",
      user: {
        username: user.username,
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber,
        country: user.country,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
}
