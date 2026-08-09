const express = require('express');
const { createSale, getSales, getSaleById } = require('../controllers/salesController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/').get(getSales).post(createSale);
router.route('/:id').get(getSaleById);

module.exports = router;
