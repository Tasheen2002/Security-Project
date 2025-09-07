import DOMPurify from "dompurify";

export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;
  return DOMPurify.sanitize(input.trim());
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePurchaseForm = (formData) => {
  const errors = {};

  if (
    !formData.date ||
    new Date(formData.date) < new Date().setHours(0, 0, 0, 0)
  ) {
    errors.date = "Please select a valid date (today or future)";
  }

  const selectedDate = new Date(formData.date);
  if (selectedDate.getDay() === 0) {
    errors.date = "Delivery is not available on Sundays";
  }

  if (!formData.deliveryTime) {
    errors.deliveryTime = "Please select a delivery time";
  }

  if (!formData.deliveryLocation) {
    errors.deliveryLocation = "Please select a delivery location";
  }

  if (!formData.productName) {
    errors.productName = "Please select a product";
  }

  if (!formData.quantity || formData.quantity < 1 || formData.quantity > 100) {
    errors.quantity = "Quantity must be between 1 and 100";
  }

  if (formData.message && formData.message.length > 500) {
    errors.message = "Message cannot exceed 500 characters";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const escapeHtml = (text) => {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};
