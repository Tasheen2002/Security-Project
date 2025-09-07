import Product from "../models/Product.js";
import Review from "../models/Review.js";

// Get all products
export const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const search = req.query.search;
    const category = req.query.category;
    const minPrice = parseFloat(req.query.minPrice);
    const maxPrice = parseFloat(req.query.maxPrice);
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    let query = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Price filter
    if (!isNaN(minPrice) && !isNaN(maxPrice)) {
      query.price = { $gte: minPrice, $lte: maxPrice };
    } else if (!isNaN(minPrice)) {
      query.price = { $gte: minPrice };
    } else if (!isNaN(maxPrice)) {
      query.price = { $lte: maxPrice };
    }

    const products = await Product.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    res.json({
      success: true,
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get single product by ID
export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId).select('-__v');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Create new product (Admin only)
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      originalPrice,
      category,
      image,
      images,
      inStock,
      specifications,
      featured
    } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "Name, price, and category are required"
      });
    }

    if (price < 0 || (originalPrice && originalPrice < 0)) {
      return res.status(400).json({
        success: false,
        message: "Prices must be non-negative"
      });
    }

    const product = new Product({
      name,
      description,
      price,
      originalPrice,
      category,
      image,
      images: images || [],
      inStock: inStock !== false, // Default to true
      specifications: specifications || {},
      featured: featured || false,
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update product (Admin only)
export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const updates = req.body;

    // Validate price fields
    if (updates.price !== undefined && updates.price < 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be non-negative"
      });
    }

    if (updates.originalPrice !== undefined && updates.originalPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Original price must be non-negative"
      });
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      updates,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Delete product (Admin only)
export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Also delete all reviews for this product
    await Review.deleteMany({ productId });

    res.json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get product categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get featured products
export const getFeaturedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    
    const products = await Product.find({ featured: true, inStock: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-__v');

    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch featured products",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get search suggestions
export const getSearchSuggestions = async (req, res) => {
  try {
    const query = req.query.q;
    const limit = parseInt(req.query.limit) || 6;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        suggestions: []
      });
    }

    // Search products by name and description
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ],
      inStock: true
    })
    .sort({ name: 1 })
    .limit(limit)
    .select('_id name price image category');

    // Create product suggestions
    const productSuggestions = products.map(product => ({
      id: product._id,
      type: 'product',
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category
    }));

    // Get category suggestions
    const categories = await Product.distinct('category', {
      category: { $regex: query, $options: 'i' }
    });

    const categorySuggestions = categories.slice(0, 2).map(category => ({
      id: `category-${category}`,
      type: 'category',
      text: category,
      category: category
    }));

    // Combine suggestions
    const allSuggestions = [
      ...productSuggestions.slice(0, Math.floor(limit * 0.8)), // 80% products
      ...categorySuggestions
    ].slice(0, limit);

    res.json({
      success: true,
      suggestions: allSuggestions
    });
  } catch (error) {
    console.error('Get search suggestions error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch search suggestions",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};