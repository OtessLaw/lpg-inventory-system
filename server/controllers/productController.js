const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/products
// @access  Private (Admin & Staff)
const getProducts = async (req, res, next) => {
  try {
    const { category, search, activeOnly } = req.query;
    let query = {};

    if (activeOnly === 'true') {
      query.isActive = true;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const products = await Product.find(query).sort({ category: 1, name: 1 });

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: 'PRODUCT_NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
  try {
    const { name, category, unit, currentStock, minimumStock, costPrice, sellingPrice } = req.body;

    if (!name || costPrice === undefined || sellingPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, cost price, and selling price are required',
        error: 'MISSING_FIELDS',
      });
    }

    const product = await Product.create({
      name,
      category: category || 'Gas',
      unit: unit || 'kg',
      currentStock: currentStock !== undefined ? Number(currentStock) : 0,
      minimumStock: minimumStock !== undefined ? Number(minimumStock) : 300,
      costPrice: Number(costPrice),
      sellingPrice: Number(sellingPrice),
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product details
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
  try {
    const { name, category, unit, minimumStock, costPrice, sellingPrice } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: 'PRODUCT_NOT_FOUND',
      });
    }

    if (name) product.name = name;
    if (category) product.category = category;
    if (unit) product.unit = unit;
    if (minimumStock !== undefined) product.minimumStock = Number(minimumStock);
    if (costPrice !== undefined) product.costPrice = Number(costPrice);
    if (sellingPrice !== undefined) product.sellingPrice = Number(sellingPrice);

    await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle product active status
// @route   PATCH /api/products/:id/status
// @access  Private/Admin
const toggleProductStatus = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: 'PRODUCT_NOT_FOUND',
      });
    }

    product.isActive = !product.isActive;
    await product.save();

    res.json({
      success: true,
      message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleProductStatus,
};
