import Review from "../models/Review.js";
import Product from "../models/Product.js";

// Get reviews for a product
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const reviews = await Review.find({ productId })
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .select("-__v -userId");

    const totalReviews = await Review.countDocuments({ productId });
    const totalPages = Math.ceil(totalReviews / limit);

    // Calculate rating statistics
    const ratingStats = await Review.aggregate([
      { $match: { productId: productId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          ratings: {
            $push: {
              rating: "$rating",
            },
          },
        },
      },
    ]);

    const stats = ratingStats[0] || { averageRating: 0, totalReviews: 0 };

    res.json({
      success: true,
      reviews,
      stats: {
        averageRating: Math.round(stats.averageRating * 10) / 10,
        totalReviews: stats.totalReviews,
      },
      pagination: {
        currentPage: page,
        totalPages,
        totalReviews,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get product reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Create a new review
export const createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.auth.sub; // Fixed: use req.auth instead of req.user
    const username = req.auth.nickname || req.auth.email; // Fixed: use req.auth instead of req.user
    const { rating, comment } = req.body;

    // Validation
    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Rating and comment are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    if (comment.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Comment must be 500 characters or less",
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ productId, userId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    const review = new Review({
      productId,
      userId,
      username,
      rating: parseInt(rating),
      comment: comment.trim(),
    });

    await review.save();

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review: {
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        username: review.username,
        createdAt: review.createdAt,
      },
    });
  } catch (error) {
    console.error("Create review error:", error);

    // Handle duplicate review error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to submit review",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Update a review
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.auth.sub; // Fixed: use req.auth instead of req.user
    const { rating, comment } = req.body;

    // Validation
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    if (comment && comment.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Comment must be 500 characters or less",
      });
    }

    const review = await Review.findOne({ _id: reviewId, userId });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or you don't have permission to edit it",
      });
    }

    // Update fields
    if (rating) review.rating = parseInt(rating);
    if (comment) review.comment = comment.trim();

    await review.save();

    res.json({
      success: true,
      message: "Review updated successfully",
      review: {
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        username: review.username,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update review",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Delete a review
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.auth.sub; // Fixed: use req.auth instead of req.user
    const userRole = req.auth.role; // Fixed: use req.auth instead of req.user

    let query = { _id: reviewId };

    // Non-admin users can only delete their own reviews
    if (!userRole || !["admin", "staff"].includes(userRole)) {
      query.userId = userId;
    }

    const review = await Review.findOneAndDelete(query);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or you don't have permission to delete it",
      });
    }

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete review",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Get user's reviews
export const getUserReviews = async (req, res) => {
  try {
    const userId = req.auth.sub; // Fixed: use req.auth instead of req.user
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ userId })
      .populate("productId", "name image")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-__v -userId");

    const totalReviews = await Review.countDocuments({ userId });
    const totalPages = Math.ceil(totalReviews / limit);

    res.json({
      success: true,
      reviews,
      pagination: {
        currentPage: page,
        totalPages,
        totalReviews,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get user reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your reviews",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};
