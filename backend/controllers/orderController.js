import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import { validateEmail } from "../utils/validation.js";

// Create a new order
export const createOrder = async (req, res) => {
  try {
    const userId = req.auth.sub; // Fixed: use req.auth instead of req.user
    const username = req.auth.nickname || req.auth.email; // Fixed: use req.auth instead of req.user
    const { items, shipping, billing, paymentMethod, totals } = req.body;

    console.log("🔍 Order creation debug:");
    console.log("User ID:", userId);
    console.log("Username:", username);
    console.log("Items received:", JSON.stringify(items, null, 2));
    console.log("Shipping:", JSON.stringify(shipping, null, 2));
    console.log("Payment method:", paymentMethod);
    console.log("Totals:", JSON.stringify(totals, null, 2));

    // Validation
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
      });
    }

    if (!shipping || !billing) {
      return res.status(400).json({
        success: false,
        message: "Shipping and billing information are required",
      });
    }

    if (!totals || !totals.subtotal || !totals.total) {
      return res.status(400).json({
        success: false,
        message: "Order totals are required",
      });
    }

    // Validate email addresses
    if (!validateEmail(shipping.email) || !validateEmail(billing.email)) {
      return res.status(400).json({
        success: false,
        message: "Valid email addresses are required",
      });
    }

    // Validate payment method
    if (!["card", "cod", "bank_transfer"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    // Create order
    console.log("📦 Creating order with mapped items...");
    const mappedItems = items.map((item) => {
      console.log("📝 Mapping item:", JSON.stringify(item, null, 2));
      return {
        productId: item.productId || item._id,
        productName: item.productName,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      };
    });
    console.log("📦 Mapped items:", JSON.stringify(mappedItems, null, 2));

    const order = new Order({
      userId,
      username,
      items: mappedItems,
      shipping,
      billing,
      paymentMethod,
      totals: {
        subtotal: totals.subtotal,
        tax: totals.tax || 0,
        shipping: totals.shipping || 0,
        total: totals.total,
      },
    });

    console.log("💾 Saving order to database...");
    await order.save();
    console.log("✅ Order saved successfully:", order.orderId);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      orderId: order.orderId,
      order: {
        orderId: order.orderId,
        status: order.orderStatus,
        total: order.totals.total,
        items: order.items,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Create order error:", error);
    console.error("❌ Error details:", error.message);
    console.error("❌ Error stack:", error.stack);

    // Check for validation errors
    if (error.name === "ValidationError") {
      console.error("❌ Validation errors:", error.errors);
      const validationErrors = Object.keys(error.errors).map((key) => ({
        field: key,
        message: error.errors[key].message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Validation error",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Get user's orders
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.auth.sub; // Fixed: use req.auth instead of req.user
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-__v -userId -username");

    const totalOrders = await Order.countDocuments({ userId });
    const totalPages = Math.ceil(totalOrders / limit);

    res.json({
      success: true,
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get user orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Get specific order by ID
export const getOrderById = async (req, res) => {
  try {
    const userId = req.auth.sub; // Fixed: use req.auth instead of req.user
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId, userId }).select(
      "-__v -userId -username"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Cancel order
export const cancelOrder = async (req, res) => {
  try {
    const userId = req.auth.sub; // Fixed: use req.auth instead of req.user
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({ orderId, userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if order can be cancelled
    if (["shipped", "delivered", "cancelled"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.orderStatus}`,
      });
    }

    order.orderStatus = "cancelled";
    order.cancelledAt = new Date();
    order.cancellationReason = reason || "Cancelled by customer";

    await order.save();

    res.json({
      success: true,
      message: "Order cancelled successfully",
      order: {
        orderId: order.orderId,
        status: order.orderStatus,
        cancelledAt: order.cancelledAt,
        cancellationReason: order.cancellationReason,
      },
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Admin: Get all orders
export const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const skip = (page - 1) * limit;

    let query = {};
    if (
      status &&
      [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ].includes(status)
    ) {
      query.orderStatus = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-__v");

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    res.json({
      success: true,
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Admin: Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber, notes } = req.body;

    if (
      ![
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.orderStatus = status;

    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    if (notes) {
      order.notes = notes;
    }

    if (status === "delivered") {
      order.deliveredAt = new Date();
      order.paymentStatus = "paid"; // Mark as paid when delivered for COD orders
    }

    if (status === "shipped" && !order.estimatedDelivery) {
      // Set estimated delivery to 5 days from shipping
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);
      order.estimatedDelivery = estimatedDelivery;
    }

    await order.save();

    res.json({
      success: true,
      message: "Order status updated successfully",
      order: {
        orderId: order.orderId,
        status: order.orderStatus,
        trackingNumber: order.trackingNumber,
        estimatedDelivery: order.estimatedDelivery,
        deliveredAt: order.deliveredAt,
      },
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};
