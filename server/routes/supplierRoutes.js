const express = require('express');
const {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  toggleSupplierStatus,
} = require('../controllers/supplierController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getSuppliers)
  .post(createSupplier);

router.route('/:id')
  .get(getSupplierById)
  .put(authorize('admin'), updateSupplier);

router.route('/:id/status')
  .patch(authorize('admin'), toggleSupplierStatus);

module.exports = router;
