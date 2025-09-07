import express from "express";
import { auth } from "../middleware/auth.js";
import rateLimit from "../middleware/rateLimit.js";
import sanitizeInput from "../middleware/sanitizeInput.js";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

const router = express.Router();

// Apply authentication middleware to all order routes
router.use(auth);
router.use(rateLimit);

// Create new order from cart
router.post("/", sanitizeInput, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { shippingAddress, paymentMethod } = req.body;
    
    // Validate required fields
    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({ 
        error: "Shipping address and payment method are required" 
      });
    }
    
    // Get user's cart
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }
    
    // Check stock availability for all items
    for (const item of cart.items) {
      if (!item.productId || item.productId.stock < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${item.productId?.name || 'product'}` 
        });
      }
    }
    
    // Calculate total
    const orderTotal = cart.items.reduce((sum, item) => {
      return sum + (item.productId.price * item.quantity);
    }, 0);
    
    // Create order
    const order = new Order({
      userId,
      items: cart.items.map(item => ({
        productId: item.productId._id,
        productName: item.productId.name,
        price: item.productId.price,
        quantity: item.quantity
      })),
      total: orderTotal,
      status: 'pending',
      shippingAddress,
      paymentMethod,
      orderDate: new Date()
    });
    
    await order.save();
    
    // Update product stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(
        item.productId._id,
        { $inc: { stock: -item.quantity } }
      );
    }
    
    // Clear cart
    cart.items = [];
    await cart.save();
    
    await order.populate('items.productId');
    
    res.status(201).json({
      message: "Order created successfully",
      order
    });
  } catch (err) {
    next(err);
  }
});

// Get user's orders
router.get("/", async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    const query = { userId };
    if (status) {
      query.status = status;
    }
    
    const orders = await Order.find(query)
      .populate('items.productId')
      .limit(limitNum * 1)
      .skip((pageNum - 1) * limitNum)
      .sort({ orderDate: -1 });
    
    const total = await Order.countDocuments(query);
    
    res.json({
      orders,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total
    });
  } catch (err) {
    next(err);
  }
});

// Get specific order by ID
router.get("/:orderId", async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.orderId;
    
    const order = await Order.findOne({ _id: orderId, userId })
      .populate('items.productId');
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// Cancel order (user can only cancel their own pending orders)
router.put("/:orderId/cancel", async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.orderId;
    
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ 
        error: "Only pending orders can be cancelled" 
      });
    }
    
    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: item.quantity } }
      );
    }
    
    order.status = 'cancelled';
    order.updatedAt = new Date();
    await order.save();
    
    res.json({
      message: "Order cancelled successfully",
      order
    });
  } catch (err) {
    next(err);
  }
});

// Admin: Get all orders
router.get("/admin/all", async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const currentUser = await User.findById(currentUserId);
    
    if (!currentUser || currentUser.role !== "admin") {
      return res.status(403).json({ 
        error: "Access denied. Admin privileges required." 
      });
    }
    
    const { page = 1, limit = 10, status, search } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    const query = {};
    if (status) {
      query.status = status;
    }
    
    const orders = await Order.find(query)
      .populate('userId', 'username email name')
      .populate('items.productId')
      .limit(limitNum * 1)
      .skip((pageNum - 1) * limitNum)
      .sort({ orderDate: -1 });
    
    const total = await Order.countDocuments(query);
    
    res.json({
      orders,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total
    });
  } catch (err) {
    next(err);
  }
});

// Admin: Update order status
router.put("/admin/:orderId/status", sanitizeInput, async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const currentUser = await User.findById(currentUserId);
    
    if (!currentUser || currentUser.role !== "admin") {
      return res.status(403).json({ 
        error: "Access denied. Admin privileges required." 
      });
    }
    
    const orderId = req.params.orderId;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status, updatedAt: new Date() },
      { new: true }
    ).populate('items.productId');
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    res.json({
      message: "Order status updated successfully",
      order
    });
  } catch (err) {
    next(err);
  }
});

export default router;
