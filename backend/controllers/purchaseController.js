// controllers/purchaseController.js
// Handles purchase creation, listing, and management
import Purchase from "../models/Purchase.js";
import User from "../models/User.js";

export async function createPurchase(req, res, next) {
  try {
    const currentUserId = req.user.id;
    const currentUser = await User.findById(currentUserId);
    
    if (!currentUser) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    
    // Create purchase for the authenticated user only
    const purchase = new Purchase({
      userId: currentUserId,
      username: currentUser.username,
      date: req.body.date,
      deliveryTime: req.body.deliveryTime,
      deliveryLocation: req.body.deliveryLocation,
      productName: req.body.productName,
      quantity: parseInt(req.body.quantity),
      message: req.body.message,
      status: "pending",
      createdAt: new Date()
    });
    
    await purchase.save();
    res.status(201).json(purchase);
  } catch (err) {
    next(err);
  }
}

export async function getUserPurchases(req, res, next) {
  try {
    const requestedUsername = req.params.username;
    const currentUserId = req.user.id;
    const currentUser = await User.findById(currentUserId);
    
    if (!currentUser) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    
    // Authorization check: users can only access their own purchases
    // or admins can access any user's purchases
    if (currentUser.username !== requestedUsername && currentUser.role !== "admin") {
      return res.status(403).json({ 
        error: "Access denied. You can only access your own purchases." 
      });
    }
    
    const purchases = await Purchase.find({ username: requestedUsername });
    res.json(purchases);
  } catch (err) {
    next(err);
  }
}

export async function getCurrentUserPurchases(req, res, next) {
  try {
    const currentUserId = req.user.id;
    const purchases = await Purchase.find({ userId: currentUserId });
    res.json(purchases);
  } catch (err) {
    next(err);
  }
}

export async function getAllPurchases(req, res, next) {
  try {
    const currentUserId = req.user.id;
    const currentUser = await User.findById(currentUserId);
    
    if (!currentUser) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    
    // Only admins can view all purchases
    if (currentUser.role !== "admin") {
      return res.status(403).json({ 
        error: "Access denied. Admin privileges required." 
      });
    }
    
    const purchases = await Purchase.find()
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });
    res.json(purchases);
  } catch (err) {
    next(err);
  }
}

export async function updatePurchaseStatus(req, res, next) {
  try {
    const currentUserId = req.user.id;
    const currentUser = await User.findById(currentUserId);
    const purchaseId = req.params.id;
    const { status } = req.body;
    
    if (!currentUser) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    
    // Only admins can update purchase status
    if (currentUser.role !== "admin") {
      return res.status(403).json({ 
        error: "Access denied. Admin privileges required." 
      });
    }
    
    const purchase = await Purchase.findByIdAndUpdate(
      purchaseId,
      { status, updatedAt: new Date() },
      { new: true }
    );
    
    if (!purchase) {
      return res.status(404).json({ error: "Purchase not found" });
    }
    
    res.json(purchase);
  } catch (err) {
    next(err);
  }
}
