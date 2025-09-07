// middleware/sanitizeInput.js
// Middleware to sanitize all string inputs in req.body
import { sanitize } from "../utils/sanitize.js";

export default function sanitizeInput(req, res, next) {
  Object.keys(req.body).forEach((key) => {
    if (typeof req.body[key] === "string") {
      req.body[key] = sanitize(req.body[key]);
    }
  });
  next();
}
