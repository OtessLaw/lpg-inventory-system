const express = require('express');
const {
  recordStockIn,
  recordAdjustment,
  getTransactions,
} = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/stock-in', recordStockIn);
router.post('/adjustment', authorize('admin'), recordAdjustment);
router.get('/transactions', getTransactions);

module.exports = router;
