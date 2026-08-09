const Product = require('../models/Product');
const Sale = require('../models/Sale');
const StockTransaction = require('../models/StockTransaction');

// @desc    Get real-time dashboard summary metrics
// @route   GET /api/dashboard/summary
// @access  Private
const getSummary = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Current LPG Stock (kg)
    const lpgProducts = await Product.find({ category: 'Gas', isActive: true });
    const currentLpgStockKg = lpgProducts.reduce((acc, p) => acc + p.currentStock, 0);

    // 2. Today's Sales (Revenue, Transactions count, Quantity sold)
    const todaySales = await Sale.find({
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    });

    const todaySalesRevenue = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);
    const todayTransactionCount = todaySales.length;

    // Today's LPG kg sold
    let todayLpgSoldKg = 0;
    todaySales.forEach((sale) => {
      sale.items.forEach((item) => {
        // Find if this item is Gas category or measured in kg
        todayLpgSoldKg += item.quantity;
      });
    });

    // 3. Stock Received Today (kg)
    const todayStockInTx = await StockTransaction.find({
      type: 'STOCK_IN',
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    });
    const stockReceivedTodayKg = todayStockInTx.reduce((acc, tx) => acc + tx.quantity, 0);

    // 4. Low stock items
    const allProducts = await Product.find({ isActive: true });
    const lowStockItems = allProducts.filter((p) => p.currentStock <= p.minimumStock);
    const lowStockCount = lowStockItems.length;

    res.json({
      success: true,
      data: {
        currentLpgStockKg,
        todayLpgSoldKg,
        todaySalesRevenue,
        todayTransactionCount,
        stockReceivedTodayKg,
        lowStockCount,
        lowStockItems: lowStockItems.map((p) => ({
          _id: p._id,
          name: p.name,
          category: p.category,
          unit: p.unit,
          currentStock: p.currentStock,
          minimumStock: p.minimumStock,
          status: p.currentStock <= 0 ? 'OUT OF STOCK' : 'LOW STOCK',
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard sales chart data (revenue & quantity sold)
// @route   GET /api/dashboard/sales-chart
// @access  Private
const getSalesChart = async (req, res, next) => {
  try {
    const days = Number(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const sales = await Sale.find({
      createdAt: { $gte: startDate },
    }).sort({ createdAt: 1 });

    // Group sales by day (YYYY-MM-DD)
    const dateMap = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dateMap[key] = { date: key, label, revenue: 0, lpgSoldKg: 0, transactions: 0 };
    }

    sales.forEach((sale) => {
      const key = new Date(sale.createdAt).toISOString().split('T')[0];
      if (dateMap[key]) {
        dateMap[key].revenue += sale.totalAmount;
        dateMap[key].transactions += 1;
        sale.items.forEach((item) => {
          dateMap[key].lpgSoldKg += item.quantity;
        });
      }
    });

    const chartData = Object.values(dateMap);

    res.json({
      success: true,
      data: chartData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get stock movement chart data (Stock In vs Stock Out)
// @route   GET /api/dashboard/stock-chart
// @access  Private
const getStockChart = async (req, res, next) => {
  try {
    const days = Number(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const transactions = await StockTransaction.find({
      createdAt: { $gte: startDate },
    }).sort({ createdAt: 1 });

    const dateMap = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dateMap[key] = { date: key, label, stockIn: 0, stockOut: 0 };
    }

    transactions.forEach((tx) => {
      const key = new Date(tx.createdAt).toISOString().split('T')[0];
      if (dateMap[key]) {
        if (tx.type === 'STOCK_IN') {
          dateMap[key].stockIn += tx.quantity;
        } else if (tx.type === 'SALE') {
          dateMap[key].stockOut += tx.quantity;
        } else if (tx.type === 'ADJUSTMENT') {
          if (tx.quantity > 0) {
            dateMap[key].stockIn += tx.quantity;
          } else {
            dateMap[key].stockOut += Math.abs(tx.quantity);
          }
        }
      }
    });

    const chartData = Object.values(dateMap);

    res.json({
      success: true,
      data: chartData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getSalesChart,
  getStockChart,
};
