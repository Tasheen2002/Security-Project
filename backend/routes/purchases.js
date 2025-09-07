import express from "express";
import { auth } from "../middleware/auth.js";
import rateLimit from "../middleware/rateLimit.js";
import sanitizeInput from "../middleware/sanitizeInput.js";
import {
  createPurchase,
  getCurrentUserPurchases,
  getUserPurchases,
  getAllPurchases,
  updatePurchaseStatus
} from "../controllers/purchaseController.js";
import User from "../models/User.js";
import Purchase from "../models/Purchase.js";

const router = express.Router();

// User: create purchase (authenticated users only)
router.post("/", auth, sanitizeInput, rateLimit, createPurchase);

// User: view my purchases (authenticated users only)
router.get("/mine", auth, rateLimit, getCurrentUserPurchases);

// Admin: view all purchases (admin only)
router.get("/", auth, rateLimit, getAllPurchases);

// Admin/User: view purchases by specific user (with authorization check)
router.get("/user/:username", auth, rateLimit, getUserPurchases);

// Admin: update purchase status (admin only)
router.patch("/:id/status", auth, sanitizeInput, rateLimit, updatePurchaseStatus);

// Admin: delete any purchase (admin only)
router.delete("/:id", auth, rateLimit, async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const currentUser = await User.findById(currentUserId);
    
    if (!currentUser) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    
    // Only admins can delete purchases
    if (currentUser.role !== "admin") {
      return res.status(403).json({ 
        error: "Access denied. Admin privileges required." 
      });
    }
    
    const purchase = await Purchase.findByIdAndDelete(req.params.id);
    if (!purchase) {
      return res.status(404).json({ error: "Purchase not found" });
    }
    
    res.json({ 
      message: "Purchase deleted successfully", 
      deletedPurchase: purchase 
    });
  } catch (err) {
    next(err);
  }
});

// Get purchase stats (role-based access)
router.get("/stats", auth, rateLimit, async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const currentUser = await User.findById(currentUserId);
    
    if (!currentUser) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    
    if (currentUser.role === 'admin') {
      // Admin sees global stats
      const totalPurchases = await Purchase.countDocuments();
      const uniqueUsers = await Purchase.distinct('userId').then(users => users.length);
      const pendingPurchases = await Purchase.countDocuments({ status: 'pending' });
      const completedPurchases = await Purchase.countDocuments({ status: 'delivered' });
      
      res.json({
        role: 'admin',
        totalPurchases,
        uniqueUsers,
        pendingPurchases,
        completedPurchases,
        message: "Admin stats view"
      });
    } else {
      // Regular users see only their stats
      const userPurchases = await Purchase.countDocuments({ userId: currentUserId });
      const pendingPurchases = await Purchase.countDocuments({ 
        userId: currentUserId, 
        status: 'pending' 
      });
      const completedPurchases = await Purchase.countDocuments({ 
        userId: currentUserId, 
        status: 'delivered' 
      });
      
      res.json({
        role: 'user',
        myPurchases: userPurchases,
        pendingPurchases,
        completedPurchases,
        message: "User stats view"
      });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
