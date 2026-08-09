const mongoose = require('mongoose');

const stockTransactionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    type: {
      type: String,
      enum: ['STOCK_IN', 'SALE', 'ADJUSTMENT'],
      required: [true, 'Transaction type is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
    },
    previousStock: {
      type: Number,
      required: [true, 'Previous stock level is required'],
    },
    newStock: {
      type: Number,
      required: [true, 'New stock level is required'],
    },
    unitCost: {
      type: Number,
      default: 0,
    },
    reference: {
      type: String,
      default: '',
      trim: true,
    },
    reason: {
      type: String,
      default: '',
      trim: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User performing action is required'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StockTransaction', stockTransactionSchema);
