// middleware/validatePurchase.js
// Validates purchase data for security and business rules

import { isValidDate, isSunday, isFutureDate } from "../utils/dateUtils.js";
import { sanitize } from "../utils/sanitize.js";

const DELIVERY_TIMES = ["10 AM", "11 AM", "12 PM"];
const DISTRICTS = [
  "Colombo",
  "Gampaha",
  "Kandy",
  "Galle",
  "Matara",
  "Kurunegala",
  "Jaffna",
  "Badulla",
  "Anuradhapura",
  "Ratnapura",
];
const PRODUCTS = [
  "Laptop",
  "Smartphone",
  "Tablet",
  "Headphones",
  "Camera",
  "Smartwatch",
  "Printer",
  "Monitor",
  "Keyboard",
  "Mouse",
];

export default function validatePurchase(req, res, next) {
  const {
    date,
    deliveryTime,
    deliveryLocation,
    productName,
    quantity,
    message,
  } = req.body;

  // Validate date
  if (!isValidDate(date) || isSunday(date) || !isFutureDate(date)) {
    return res
      .status(400)
      .json({
        error: "Invalid purchase date. Must be a future date and not a Sunday.",
      });
  }

  // Validate delivery time
  if (!DELIVERY_TIMES.includes(deliveryTime)) {
    return res.status(400).json({ error: "Invalid delivery time." });
  }

  // Validate delivery location
  if (!DISTRICTS.includes(deliveryLocation)) {
    return res.status(400).json({ error: "Invalid delivery location." });
  }

  // Validate product name
  if (!PRODUCTS.includes(productName)) {
    return res.status(400).json({ error: "Invalid product name." });
  }

  // Validate quantity
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    return res
      .status(400)
      .json({ error: "Invalid quantity. Must be between 1 and 100." });
  }

  // Sanitize message
  req.body.message = sanitize(message);

  next();
}
