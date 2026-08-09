const Product = require('../models/Product');
const Sale = require('../models/Sale');
const StockTransaction = require('../models/StockTransaction');

// @desc    Get Daily Inventory Report for a specific date
// @route   GET /api/reports/daily
// @access  Private
const getDailyReport = async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Transactions during the selected day
    const dayTransactions = await StockTransaction.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    }).populate('product', 'name category unit');

    let stockReceivedKg = 0;
    let stockSoldKg = 0;
    let adjustmentsKg = 0;

    dayTransactions.forEach((tx) => {
      if (tx.type === 'STOCK_IN') {
        stockReceivedKg += tx.quantity;
      } else if (tx.type === 'SALE') {
        stockSoldKg += tx.quantity;
      } else if (tx.type === 'ADJUSTMENT') {
        adjustmentsKg += tx.quantity; // positive for increase, negative for decrease
      }
    });

    // 2. Sales during the day
    const daySales = await Sale.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    const totalSalesRevenue = daySales.reduce((acc, s) => acc + s.totalAmount, 0);
    const numberOfSales = daySales.length;

    // 3. Calculate current LPG stock right now
    const lpgProducts = await Product.find({ category: 'Gas' });
    const currentStockKg = lpgProducts.reduce((acc, p) => acc + p.currentStock, 0);

    // Calculate closing stock and opening stock for that day by working backward from current DB state
    const futureTransactions = await StockTransaction.find({
      createdAt: { $gt: endOfDay },
    });

    let closingStockKg = currentStockKg;
    futureTransactions.forEach((tx) => {
      if (tx.type === 'STOCK_IN') {
        closingStockKg -= tx.quantity;
      } else if (tx.type === 'SALE') {
        closingStockKg += tx.quantity;
      } else if (tx.type === 'ADJUSTMENT') {
        closingStockKg -= tx.quantity;
      }
    });

    const openingStockKg = closingStockKg - stockReceivedKg + stockSoldKg - adjustmentsKg;

    res.json({
      success: true,
      data: {
        date: startOfDay.toISOString().split('T')[0],
        formattedDate: startOfDay.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        openingStockKg: Math.max(0, Number(openingStockKg.toFixed(2))),
        stockReceivedKg: Number(stockReceivedKg.toFixed(2)),
        stockSoldKg: Number(stockSoldKg.toFixed(2)),
        adjustmentsKg: Number(adjustmentsKg.toFixed(2)),
        closingStockKg: Math.max(0, Number(closingStockKg.toFixed(2))),
        totalSalesRevenue: Number(totalSalesRevenue.toFixed(2)),
        numberOfSales,
        averageSaleAmount: numberOfSales > 0 ? Number((totalSalesRevenue / numberOfSales).toFixed(2)) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Sales Report for date range
// @route   GET /api/reports/sales
// @access  Private
const getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const sales = await Sale.find({
      createdAt: { $gte: start, $lte: end },
    })
      .populate('soldBy', 'name')
      .populate('items.product', 'name category unit');

    let totalRevenue = 0;
    let totalLpgKgSold = 0;
    const paymentMethodBreakdown = { Cash: 0, 'Mobile Money': 0, Card: 0, 'Bank Transfer': 0 };
    const productBreakdown = {};

    sales.forEach((sale) => {
      totalRevenue += sale.totalAmount;
      if (paymentMethodBreakdown[sale.paymentMethod] !== undefined) {
        paymentMethodBreakdown[sale.paymentMethod] += sale.totalAmount;
      }

      sale.items.forEach((item) => {
        totalLpgKgSold += item.quantity;
        const pName = item.productName || 'LPG Gas';
        if (!productBreakdown[pName]) {
          productBreakdown[pName] = { quantity: 0, revenue: 0 };
        }
        productBreakdown[pName].quantity += item.quantity;
        productBreakdown[pName].revenue += item.total;
      });
    });

    const numberOfSales = sales.length;

    res.json({
      success: true,
      data: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalLpgKgSold: Number(totalLpgKgSold.toFixed(2)),
        numberOfSales,
        averageSaleAmount: numberOfSales > 0 ? Number((totalRevenue / numberOfSales).toFixed(2)) : 0,
        paymentMethodBreakdown,
        productBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Inventory Report & Valuation
// @route   GET /api/reports/inventory
// @access  Private
const getInventoryReport = async (req, res, next) => {
  try {
    const products = await Product.find().sort({ category: 1, name: 1 });

    let totalStockKg = 0;
    let totalCostValue = 0;
    let totalRetailValue = 0;

    const inventoryItems = products.map((p) => {
      const costVal = p.currentStock * p.costPrice;
      const retailVal = p.currentStock * p.sellingPrice;

      if (p.category === 'Gas' || p.unit === 'kg') {
        totalStockKg += p.currentStock;
      }

      totalCostValue += costVal;
      totalRetailValue += retailVal;

      return {
        _id: p._id,
        name: p.name,
        category: p.category,
        unit: p.unit,
        currentStock: p.currentStock,
        minimumStock: p.minimumStock,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        costValuation: Number(costVal.toFixed(2)),
        retailValuation: Number(retailVal.toFixed(2)),
        status: p.currentStock <= 0 ? 'OUT OF STOCK' : p.currentStock <= p.minimumStock ? 'LOW STOCK' : 'IN STOCK',
      };
    });

    res.json({
      success: true,
      data: {
        totalProducts: products.length,
        totalStockKg: Number(totalStockKg.toFixed(2)),
        totalCostValue: Number(totalCostValue.toFixed(2)),
        totalRetailValue: Number(totalRetailValue.toFixed(2)),
        potentialProfit: Number((totalRetailValue - totalCostValue).toFixed(2)),
        items: inventoryItems,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDailyReport,
  getSalesReport,
  getInventoryReport,
};
