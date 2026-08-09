const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleProductStatus,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getProducts)
  .post(authorize('admin'), createProduct);

router.route('/:id')
  .get(getProductById)
  .put(authorize('admin'), updateProduct);

router.route('/:id/status')
  .patch(authorize('admin'), toggleProductStatus);

module.exports = router;
