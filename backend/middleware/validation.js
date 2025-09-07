// middleware/validation.js
// Input validation middleware using express-validator

// User registration validation
export const validateRegistration = [
  // Username validation
  (req, res, next) => {
    const { username } = req.body;
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be between 3 and 30 characters' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
    }
    next();
  },
  // Password validation
  (req, res, next) => {
    const { password } = req.body;
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
      return res.status(400).json({ 
        error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
      });
    }
    next();
  }
];

// Login validation
export const validateLogin = [
  (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Invalid input format' });
    }
    next();
  }
];

// Purchase creation validation
export const validatePurchase = [
  (req, res, next) => {
    const { date, deliveryTime, deliveryLocation, productName, quantity } = req.body;
    
    // Required fields check
    if (!date || !deliveryTime || !deliveryLocation || !productName || !quantity) {
      return res.status(400).json({ 
        error: 'All fields are required: date, deliveryTime, deliveryLocation, productName, quantity' 
      });
    }
    
    // Date validation
    const deliveryDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (deliveryDate < today) {
      return res.status(400).json({ error: 'Delivery date cannot be in the past' });
    }
    
    if (deliveryDate.getDay() === 0) {
      return res.status(400).json({ error: 'Delivery is not available on Sundays' });
    }
    
    // Quantity validation
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1 || qty > 100) {
      return res.status(400).json({ error: 'Quantity must be a number between 1 and 100' });
    }
    
    next();
  }
];

// Profile update validation
export const validateProfileUpdate = [
  (req, res, next) => {
    const { name, email, contactNumber, country } = req.body;
    
    // Email validation (if provided)
    if (email && (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Name validation (if provided)
    if (name && (typeof name !== 'string' || name.length > 100)) {
      return res.status(400).json({ error: 'Name must be a string with maximum 100 characters' });
    }
    
    // Contact number validation (if provided)
    if (contactNumber && (typeof contactNumber !== 'string' || !/^\+?[\d\s\-\(\)]+$/.test(contactNumber))) {
      return res.status(400).json({ error: 'Invalid contact number format' });
    }
    
    // Country validation (if provided)
    if (country && (typeof country !== 'string' || country.length > 100)) {
      return res.status(400).json({ error: 'Country must be a string with maximum 100 characters' });
    }
    
    next();
  }
];

// Product validation
export const validateProduct = [
  (req, res, next) => {
    const { name, price, description, stock } = req.body;
    
    // Name validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Product name is required' });
    }
    
    if (name.length > 200) {
      return res.status(400).json({ error: 'Product name must be less than 200 characters' });
    }
    
    // Price validation
    if (price === undefined || price === null) {
      return res.status(400).json({ error: 'Product price is required' });
    }
    
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ error: 'Price must be a positive number' });
    }
    
    // Description validation (optional)
    if (description && (typeof description !== 'string' || description.length > 1000)) {
      return res.status(400).json({ error: 'Description must be less than 1000 characters' });
    }
    
    // Stock validation (optional)
    if (stock !== undefined) {
      const stockNum = parseInt(stock);
      if (isNaN(stockNum) || stockNum < 0) {
        return res.status(400).json({ error: 'Stock must be a non-negative integer' });
      }
    }
    
    next();
  }
];

// Cart item validation
export const validateCartItem = [
  (req, res, next) => {
    const { productId, quantity } = req.body;
    
    // Product ID validation
    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    
    // MongoDB ObjectId format validation
    if (!/^[0-9a-fA-F]{24}$/.test(productId)) {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }
    
    // Quantity validation
    if (quantity !== undefined) {
      const qty = parseInt(quantity);
      if (isNaN(qty) || qty < 1 || qty > 100) {
        return res.status(400).json({ error: 'Quantity must be a number between 1 and 100' });
      }
    }
    
    next();
  }
];

// Order validation
export const validateOrder = [
  (req, res, next) => {
    const { shippingAddress, paymentMethod } = req.body;
    
    // Shipping address validation
    if (!shippingAddress || typeof shippingAddress !== 'string' || shippingAddress.trim().length === 0) {
      return res.status(400).json({ error: 'Shipping address is required' });
    }
    
    if (shippingAddress.length > 500) {
      return res.status(400).json({ error: 'Shipping address must be less than 500 characters' });
    }
    
    // Payment method validation
    const validPaymentMethods = ['card', 'cod', 'bank_transfer'];
    if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ 
        error: 'Payment method must be one of: card, cod, bank_transfer' 
      });
    }
    
    next();
  }
];

// Generic MongoDB ObjectId validation
export const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ error: `Invalid ${paramName} format` });
    }
    next();
  };
};

// Request rate limiting validation
export const validateRequestRate = (req, res, next) => {
  // Additional rate limiting logic can be added here
  next();
};