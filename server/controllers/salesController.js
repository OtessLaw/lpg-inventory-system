const Sale = require('../models/Sale');
const Product = require('../models/Product');
const StockTransaction = require('../models/StockTransaction');

// Helper to generate unique sequential invoice number
const generateInvoiceNumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Sale.countDocuments({
    createdAt: {
      $gte: new Date(new Date().setHours(0, 0, 0, 0)),
    },
  });
  const seq = String(count + 1).padStart(4, '0');
  return `INV-${dateStr}-${seq}`;
};

// @desc    Record new LPG Sale
// @route   POST /api/sales
// @access  Private
const createSale = async (req, res, next) => {
  try {
    const { items, discount = 0, paymentMethod = 'Cash' } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Sale must contain at least one product item',
        error: 'EMPTY_SALE_ITEMS',
      });
    }

    // Step 1: Verify all products exist and check current stock levels
    const verifiedItems = [];
    let calculatedSubtotal = 0;
    const stockUpdatesToRollback = [];

    for (const item of items) {
      const { productId, quantity } = item;
      const qty = Number(quantity);

      if (!productId || isNaN(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have a valid productId and quantity greater than 0',
          error: 'INVALID_ITEM_QUANTITY',
        });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${productId} not found`,
          error: 'PRODUCT_NOT_FOUND',
        });
      }

      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product '${product.name}' is deactivated and cannot be sold`,
          error: 'PRODUCT_INACTIVE',
        });
      }

      // Check stock availability
      if (product.currentStock < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for '${product.name}'. Available stock: ${product.currentStock} ${product.unit}. Requested: ${qty} ${product.unit}.`,
          error: 'INSUFFICIENT_STOCK',
        });
      }

      // Backend calculated total: quantity * sellingPrice
      const unitPrice = product.sellingPrice;
      const itemTotal = Number((qty * unitPrice).toFixed(2));
      calculatedSubtotal += itemTotal;

      verifiedItems.push({
        product: product._id,
        productName: product.name,
        quantity: qty,
        unitPrice,
        total: itemTotal,
        previousStock: product.currentStock,
        unit: product.unit,
      });
    }

    // Calculate final financial totals on backend
    const numDiscount = Math.max(0, Number(discount) || 0);
    const calculatedTotalAmount = Math.max(0, Number((calculatedSubtotal - numDiscount).toFixed(2)));
    const invoiceNumber = await generateInvoiceNumber();

    // Step 2: Atomic concurrency-safe stock deduction
    const processedTransactions = [];
    const updatedProducts = [];

    try {
      for (const item of verifiedItems) {
        // Atomic update checking condition currentStock >= item.quantity
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: item.product,
            currentStock: { $gte: item.quantity },
          },
          {
            $inc: { currentStock: -item.quantity },
          },
          { new: true }
        );

        if (!updatedProduct) {
          // Concurrency collision or stock changed right before execution!
          throw new Error(
            `Stock conflict: Insufficient stock for '${item.productName}' during checkout. Sale aborted.`
          );
        }

        updatedProducts.push(updatedProduct);

        // Record stock reduction rollback tracking in case of failure later
        stockUpdatesToRollback.push({
          productId: item.product,
          quantity: item.quantity,
        });

        // Prepare transaction entry
        processedTransactions.push({
          product: item.product,
          type: 'SALE',
          quantity: item.quantity,
          previousStock: item.previousStock,
          newStock: updatedProduct.currentStock,
          unitCost: updatedProduct.costPrice,
          reference: invoiceNumber,
          reason: `Sale Invoice #${invoiceNumber}`,
          performedBy: req.user._id,
        });
      }

      // Step 3: Create StockTransactions
      await StockTransaction.insertMany(processedTransactions);

      // Step 4: Create Sale Record
      const sale = await Sale.create({
        invoiceNumber,
        items: verifiedItems.map((i) => ({
          product: i.product,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.total,
        })),
        subtotal: calculatedSubtotal,
        discount: numDiscount,
        totalAmount: calculatedTotalAmount,
        paymentMethod,
        soldBy: req.user._id,
      });

      const populatedSale = await Sale.findById(sale._id).populate('soldBy', 'name email');

      res.status(201).json({
        success: true,
        message: 'Sale recorded successfully',
        data: {
          sale: populatedSale,
          invoiceNumber,
          totalAmount: calculatedTotalAmount,
        },
      });
    } catch (atomicErr) {
      // Rollback any stock deductions if mid-process error occurred
      for (const rb of stockUpdatesToRollback) {
        await Product.findByIdAndUpdate(rb.productId, {
          $inc: { currentStock: rb.quantity },
        });
      }
      return res.status(400).json({
        success: false,
        message: atomicErr.message,
        error: 'SALE_PROCESSING_ERROR',
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get Sales history with search, date range & pagination
// @route   GET /api/sales
// @access  Private
const getSales = async (req, res, next) => {
  try {
    const { startDate, endDate, invoiceNumber, page = 1, limit = 20 } = req.query;

    let query = {};

    if (invoiceNumber) {
      query.invoiceNumber = { $regex: invoiceNumber, $options: 'i' };
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

    const sales = await Sale.find(query)
      .populate('soldBy', 'name email')
      .populate('items.product', 'name category unit')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Sale.countDocuments(query);

    res.json({
      success: true,
      count: sales.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: sales,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single sale / invoice details
// @route   GET /api/sales/:id
// @access  Private
const getSaleById = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('soldBy', 'name email')
      .populate('items.product', 'name category unit');

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale invoice not found',
        error: 'SALE_NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: sale,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSale,
  getSales,
  getSaleById,
};
