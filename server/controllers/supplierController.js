const Supplier = require('../models/Supplier');
const StockTransaction = require('../models/StockTransaction');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
const getSuppliers = async (req, res, next) => {
  try {
    const { activeOnly, search } = req.query;
    let query = {};

    if (activeOnly === 'true') {
      query.isActive = true;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const suppliers = await Supplier.find(query).sort({ name: 1 });

    res.json({
      success: true,
      count: suppliers.length,
      data: suppliers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single supplier details with stock-in history
// @route   GET /api/suppliers/:id
// @access  Private
const getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
        error: 'SUPPLIER_NOT_FOUND',
      });
    }

    const transactions = await StockTransaction.find({
      supplier: supplier._id,
      type: 'STOCK_IN',
    })
      .populate('product', 'name unit')
      .populate('performedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        supplier,
        transactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create supplier
// @route   POST /api/suppliers
// @access  Private
const createSupplier = async (req, res, next) => {
  try {
    const { name, phone, email, address } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Supplier name is required',
        error: 'MISSING_NAME',
      });
    }

    const supplier = await Supplier.create({
      name,
      phone: phone || '',
      email: email || '',
      address: address || '',
    });

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private/Admin
const updateSupplier = async (req, res, next) => {
  try {
    const { name, phone, email, address } = req.body;

    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
        error: 'SUPPLIER_NOT_FOUND',
      });
    }

    if (name) supplier.name = name;
    if (phone !== undefined) supplier.phone = phone;
    if (email !== undefined) supplier.email = email;
    if (address !== undefined) supplier.address = address;

    await supplier.save();

    res.json({
      success: true,
      message: 'Supplier updated successfully',
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle supplier status
// @route   PATCH /api/suppliers/:id/status
// @access  Private/Admin
const toggleSupplierStatus = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
        error: 'SUPPLIER_NOT_FOUND',
      });
    }

    supplier.isActive = !supplier.isActive;
    await supplier.save();

    res.json({
      success: true,
      message: `Supplier ${supplier.isActive ? 'activated' : 'deactivated'} successfully`,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  toggleSupplierStatus,
};
