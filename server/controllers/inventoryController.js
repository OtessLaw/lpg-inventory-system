const Product = require('../models/Product');
const StockTransaction = require('../models/StockTransaction');

// @desc    Record Stock Received (STOCK_IN)
// @route   POST /api/inventory/stock-in
// @access  Private
const recordStockIn = async (req, res, next) => {
  try {
    const { productId, quantity, supplierId, unitCost, reference, notes } = req.body;

    const qty = Number(quantity);
    if (!productId || isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid product ID and positive quantity are required',
        error: 'INVALID_INPUT',
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: 'PRODUCT_NOT_FOUND',
      });
    }

    const previousStock = product.currentStock;
    const newStock = previousStock + qty;

    // Update product stock atomically
    product.currentStock = newStock;
    if (unitCost !== undefined && Number(unitCost) > 0) {
      product.costPrice = Number(unitCost);
    }
    await product.save();

    // Create Stock Transaction record
    const transaction = await StockTransaction.create({
      product: product._id,
      type: 'STOCK_IN',
      quantity: qty,
      previousStock,
      newStock,
      unitCost: unitCost !== undefined ? Number(unitCost) : product.costPrice,
      reference: reference || '',
      reason: notes || 'Stock received',
      supplier: supplierId || null,
      performedBy: req.user._id,
    });

    const populatedTx = await StockTransaction.findById(transaction._id)
      .populate('product', 'name unit category')
      .populate('supplier', 'name')
      .populate('performedBy', 'name email');

    res.status(201).json({
      success: true,
      message: `Successfully received ${qty} ${product.unit} of ${product.name}`,
      data: {
        product,
        transaction: populatedTx,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record Stock Adjustment
// @route   POST /api/inventory/adjustment
// @access  Private/Admin
const recordAdjustment = async (req, res, next) => {
  try {
    const { productId, adjustmentType, quantity, reason, reference } = req.body;

    const qty = Number(quantity);
    if (!productId || !adjustmentType || isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, adjustment type (INCREASE/DECREASE), and positive quantity are required',
        error: 'INVALID_INPUT',
      });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'A mandatory reason must be provided for stock adjustments (Rule 5)',
        error: 'REASON_REQUIRED',
      });
    }

    if (!['INCREASE', 'DECREASE'].includes(adjustmentType)) {
      return res.status(400).json({
        success: false,
        message: 'Adjustment type must be either INCREASE or DECREASE',
        error: 'INVALID_ADJUSTMENT_TYPE',
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: 'PRODUCT_NOT_FOUND',
      });
    }

    const previousStock = product.currentStock;
    let newStock;

    if (adjustmentType === 'INCREASE') {
      newStock = previousStock + qty;
    } else {
      // DECREASE
      if (previousStock < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for decrease adjustment. Available: ${previousStock} ${product.unit}, Attempted decrease: ${qty} ${product.unit}`,
          error: 'INSUFFICIENT_STOCK',
        });
      }
      newStock = previousStock - qty;
    }

    product.currentStock = newStock;
    await product.save();

    const transaction = await StockTransaction.create({
      product: product._id,
      type: 'ADJUSTMENT',
      quantity: adjustmentType === 'DECREASE' ? -qty : qty,
      previousStock,
      newStock,
      reference: reference || '',
      reason: `[${adjustmentType}] ${reason.trim()}`,
      performedBy: req.user._id,
    });

    const populatedTx = await StockTransaction.findById(transaction._id)
      .populate('product', 'name unit category')
      .populate('performedBy', 'name email');

    res.status(201).json({
      success: true,
      message: `Stock adjustment recorded. New stock: ${newStock} ${product.unit}`,
      data: {
        product,
        transaction: populatedTx,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Stock Movement / Audit History
// @route   GET /api/inventory/transactions
// @access  Private
const getTransactions = async (req, res, next) => {
  try {
    const { type, productId, startDate, endDate, page = 1, limit = 50 } = req.query;

    let query = {};

    if (type && type !== 'ALL') {
      query.type = type;
    }

    if (productId) {
      query.product = productId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const transactions = await StockTransaction.find(query)
      .populate('product', 'name unit category')
      .populate('supplier', 'name')
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await StockTransaction.countDocuments(query);

    res.json({
      success: true,
      count: transactions.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordStockIn,
  recordAdjustment,
  getTransactions,
};
