import express from "express";
import validateTokenViaUserinfo from "../middleware/auth0-userinfo.js";
import { checkRole } from "../middleware/rbac.js";
import sanitizeInput from "../middleware/sanitizeInput.js";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getFeaturedProducts,
  getSearchSuggestions,
} from "../controllers/productController.js";
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  getUserReviews,
} from "../controllers/reviewController.js";

const router = express.Router();

// Public routes
router.get("/", getProducts);
router.get("/featured", getFeaturedProducts);
router.get("/categories", getCategories);
router.get("/search/suggestions", getSearchSuggestions);
router.get("/:productId", getProductById);
router.get("/:productId/reviews", getProductReviews);

// User routes (require authentication)
router.post(
  "/:productId/reviews",
  validateTokenViaUserinfo,
  sanitizeInput,
  createReview
);
router.put(
  "/reviews/:reviewId",
  validateTokenViaUserinfo,
  sanitizeInput,
  updateReview
);
router.delete("/reviews/:reviewId", validateTokenViaUserinfo, deleteReview);
router.get("/user/reviews", validateTokenViaUserinfo, getUserReviews);

// Admin routes
router.post(
  "/",
  validateTokenViaUserinfo,
  checkRole(["admin"]),
  sanitizeInput,
  createProduct
);
router.put(
  "/:productId",
  validateTokenViaUserinfo,
  checkRole(["admin"]),
  sanitizeInput,
  updateProduct
);
router.delete(
  "/:productId",
  validateTokenViaUserinfo,
  checkRole(["admin"]),
  deleteProduct
);

export default router;
