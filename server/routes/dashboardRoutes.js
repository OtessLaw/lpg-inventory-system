const express = require('express');
const { getSummary, getSalesChart, getStockChart } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/summary', getSummary);
router.get('/sales-chart', getSalesChart);
router.get('/stock-chart', getStockChart);

module.exports = router;
