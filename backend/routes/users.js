import express from "express";
import { auth } from "../middleware/auth.js";
import rateLimit from "../middleware/rateLimit.js";
import sanitizeInput from "../middleware/sanitizeInput.js";
import {
  getUserProfile,
  getCurrentUserProfile,
  updateUserProfile
} from "../controllers/userController.js";
import User from "../models/User.js";

const router = express.Router();

// Get current user profile
router.get("/me", auth, rateLimit, getCurrentUserProfile);

// Update current user profile
router.put("/me", auth, sanitizeInput, rateLimit, updateUserProfile);

// Get user profile by username (with authorization check)
router.get("/:username", auth, rateLimit, getUserProfile);

// Admin: get all users
router.get("/", auth, rateLimit, async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const currentUser = await User.findById(currentUserId);
    
    if (!currentUser) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    
    // Only admins can view all users
    if (currentUser.role !== "admin") {
      return res.status(403).json({ 
        error: "Access denied. Admin privileges required." 
      });
    }
    
    const { page = 1, limit = 10, search = "" } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Build search query
    const searchQuery = search ? {
      $or: [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ]
    } : {};
    
    const users = await User.find(searchQuery)
      .select("-password")
      .limit(limitNum * 1)
      .skip((pageNum - 1) * limitNum)
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments(searchQuery);
    
    res.json({
      users,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total
    });
  } catch (err) {
    next(err);
  }
});

// Admin: update user role
router.patch("/:userId/role", auth, rateLimit, async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const currentUser = await User.findById(currentUserId);
    
    if (!currentUser) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    
    // Only admins can change user roles
    if (currentUser.role !== "admin") {
      return res.status(403).json({ 
        error: "Access denied. Admin privileges required." 
      });
    }
    
    const { role } = req.body;
    const targetUserId = req.params.userId;
    
    // Validate role
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    
    // Prevent admins from demoting themselves
    if (targetUserId === currentUserId && role === "user") {
      return res.status(400).json({ 
        error: "Cannot demote yourself from admin role" 
      });
    }
    
    const user = await User.findByIdAndUpdate(
      targetUserId,
      { role, updatedAt: new Date() },
      { new: true }
    ).select("-password");
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({
      message: "User role updated successfully",
      user
    });
  } catch (err) {
    next(err);
  }
});

// Admin: deactivate/activate user
router.patch("/:userId/status", auth, rateLimit, async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const currentUser = await User.findById(currentUserId);
    
    if (!currentUser) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    
    // Only admins can change user status
    if (currentUser.role !== "admin") {
      return res.status(403).json({ 
        error: "Access denied. Admin privileges required." 
      });
    }
    
    const { isActive } = req.body;
    const targetUserId = req.params.userId;
    
    // Prevent admins from deactivating themselves
    if (targetUserId === currentUserId && !isActive) {
      return res.status(400).json({ 
        error: "Cannot deactivate your own account" 
      });
    }
    
    const user = await User.findByIdAndUpdate(
      targetUserId,
      { isActive, updatedAt: new Date() },
      { new: true }
    ).select("-password");
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (err) {
    next(err);
  }
});

export default router;
