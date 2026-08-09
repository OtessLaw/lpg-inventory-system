const express = require('express');
const {
  getDailyReport,
  getSalesReport,
  getInventoryReport,
} = require('../controllers/reportsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/daily', getDailyReport);
router.get('/sales', getSalesReport);
router.get('/inventory', getInventoryReport);

module.exports = router;
