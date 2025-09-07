import express from "express";
import { auth } from "../middleware/auth.js";
import rateLimit from "../middleware/rateLimit.js";
import sanitizeInput from "../middleware/sanitizeInput.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

const router = express.Router();

// Apply authentication middleware to all cart routes
router.use(auth);
router.use(rateLimit);

// Get user's cart
router.get("/", async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    
    if (!cart) {
      return res.json({ items: [], total: 0 });
    }
    
    // Calculate total
    const total = cart.items.reduce((sum, item) => {
      return sum + (item.productId.price * item.quantity);
    }, 0);
    
    res.json({
      items: cart.items,
      total: total.toFixed(2)
    });
  } catch (err) {
    next(err);
  }
});

// Add item to cart
router.post("/", sanitizeInput, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;
    
    // Validate product exists and has stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({ error: "Insufficient stock" });
    }
    
    let cart = await Cart.findOne({ userId });
    
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }
    
    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );
    
    if (existingItemIndex > -1) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + parseInt(quantity);
      if (product.stock < newQuantity) {
        return res.status(400).json({ error: "Insufficient stock" });
      }
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      cart.items.push({
        productId,
        quantity: parseInt(quantity)
      });
    }
    
    cart.updatedAt = new Date();
    await cart.save();
    
    // Populate product details
    await cart.populate('items.productId');
    
    res.json({
      message: "Item added to cart",
      cart
    });
  } catch (err) {
    next(err);
  }
});

// Update cart item quantity
router.put("/:itemId", sanitizeInput, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.itemId;
    const { quantity } = req.body;
    
    if (quantity < 1) {
      return res.status(400).json({ error: "Quantity must be at least 1" });
    }
    
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }
    
    const itemIndex = cart.items.findIndex(
      item => item._id.toString() === itemId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: "Item not found in cart" });
    }
    
    // Check product stock
    const product = await Product.findById(cart.items[itemIndex].productId);
    if (!product || product.stock < quantity) {
      return res.status(400).json({ error: "Insufficient stock" });
    }
    
    cart.items[itemIndex].quantity = parseInt(quantity);
    cart.updatedAt = new Date();
    await cart.save();
    
    await cart.populate('items.productId');
    
    res.json({
      message: "Cart item updated",
      cart
    });
  } catch (err) {
    next(err);
  }
});

// Remove item from cart
router.delete("/:itemId", async (req, res, next) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.itemId;
    
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }
    
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    cart.updatedAt = new Date();
    await cart.save();
    
    res.json({
      message: "Item removed from cart",
      cart
    });
  } catch (err) {
    next(err);
  }
});

// Clear entire cart
router.post("/clear", async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    await Cart.findOneAndUpdate(
      { userId },
      { items: [], updatedAt: new Date() },
      { new: true }
    );
    
    res.json({
      message: "Cart cleared successfully",
      cart: { items: [], total: 0 }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
