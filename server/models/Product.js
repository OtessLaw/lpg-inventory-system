const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Gas', 'Cylinder', 'Regulator', 'Hose', 'Valve', 'Other'],
      default: 'Gas',
    },
    unit: {
      type: String,
      enum: ['kg', 'pcs', 'unit'],
      default: 'kg',
    },
    currentStock: {
      type: Number,
      required: [true, 'Current stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    minimumStock: {
      type: Number,
      required: [true, 'Minimum stock warning threshold is required'],
      min: [0, 'Minimum stock threshold cannot be negative'],
      default: 300,
    },
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: [0, 'Cost price cannot be negative'],
      default: 0,
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.virtual('status').get(function () {
  if (this.currentStock <= 0) return 'OUT OF STOCK';
  if (this.currentStock <= this.minimumStock) return 'LOW STOCK';
  return 'IN STOCK';
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
