require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');
const Supplier = require('./models/Supplier');
const StockTransaction = require('./models/StockTransaction');
const Sale = require('./models/Sale');

const seedData = async () => {
  try {
    await connectDB();

    console.log('[Seed] Clearing existing database collections...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Supplier.deleteMany({});
    await StockTransaction.deleteMany({});
    await Sale.deleteMany({});

    console.log('[Seed] Creating default users (Admin & Staff)...');
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@example.com',
      password: 'ChangeThisPassword123!',
      role: 'admin',
      isActive: true,
    });

    const staff = await User.create({
      name: 'Store Staff',
      email: 'staff@example.com',
      password: 'ChangeThisPassword123!',
      role: 'staff',
      isActive: true,
    });

    console.log('[Seed] Creating suppliers...');
    const supplier1 = await Supplier.create({
      name: 'Bulk Energy Ghana Ltd',
      phone: '+233 24 123 4567',
      email: 'supply@bulkenergygh.com',
      address: 'Plot 45 Heavy Industrial Area, Tema, Ghana',
    });

    const supplier2 = await Supplier.create({
      name: 'Sahara LPG Terminals',
      phone: '+233 20 987 6543',
      email: 'orders@saharalpg.com',
      address: 'Oil & Gas Port Enclave, Takoradi, Ghana',
    });

    console.log('[Seed] Creating primary LPG Gas product...');
    const lpgGas = await Product.create({
      name: 'LPG Cooking Gas (per kg)',
      category: 'Gas',
      unit: 'kg',
      currentStock: 1425,
      minimumStock: 300,
      costPrice: 12.50,
      sellingPrice: 15.00,
      isActive: true,
    });

    console.log('[Seed] Generating initial stock-in bulk delivery record...');
    await StockTransaction.create({
      product: lpgGas._id,
      type: 'STOCK_IN',
      quantity: 1000,
      previousStock: 0,
      newStock: 1000,
      unitCost: 12.50,
      reference: 'DEL-2026-001',
      reason: 'Initial Bulk Delivery Received into Storage Tank',
      supplier: supplier1._id,
      performedBy: admin._id,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    });

    await StockTransaction.create({
      product: lpgGas._id,
      type: 'STOCK_IN',
      quantity: 500,
      previousStock: 1000,
      newStock: 1500,
      unitCost: 12.50,
      reference: 'DEL-2026-042',
      reason: 'Bulk Tanker Refill Shipment Received',
      supplier: supplier1._id,
      performedBy: admin._id,
      createdAt: new Date(),
    });

    console.log('[Seed] Generating sample gas sales over past days...');
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const saleDate = new Date(now);
      saleDate.setDate(saleDate.getDate() - i);

      const isToday = i === 0;
      const salesCount = isToday ? 3 : Math.floor(Math.random() * 4) + 2;

      for (let j = 1; j <= salesCount; j++) {
        const qty = Math.floor(Math.random() * 25) + 10; // 10kg - 35kg
        const subtotal = Number((qty * lpgGas.sellingPrice).toFixed(2));
        const invDate = saleDate.toISOString().slice(0, 10).replace(/-/g, '');
        const invoiceNum = `INV-${invDate}-${String(j).padStart(4, '0')}`;

        await Sale.create({
          invoiceNumber: invoiceNum,
          items: [
            {
              product: lpgGas._id,
              productName: lpgGas.name,
              quantity: qty,
              unitPrice: lpgGas.sellingPrice,
              total: subtotal,
            },
          ],
          subtotal,
          discount: 0,
          totalAmount: subtotal,
          paymentMethod: j % 2 === 0 ? 'Cash' : 'Mobile Money',
          soldBy: staff._id,
          createdAt: saleDate,
        });

        await StockTransaction.create({
          product: lpgGas._id,
          type: 'SALE',
          quantity: qty,
          previousStock: lpgGas.currentStock,
          newStock: lpgGas.currentStock - qty,
          unitCost: lpgGas.costPrice,
          reference: invoiceNum,
          reason: `Gas Sale Invoice #${invoiceNum}`,
          performedBy: staff._id,
          createdAt: saleDate,
        });
      }
    }

    console.log('\n======================================================');
    console.log('  Database successfully re-seeded for LPG Gas ONLY!');
    console.log('======================================================');
    console.log('  ADMIN LOGIN:');
    console.log('    Email:    admin@example.com');
    console.log('    Password: ChangeThisPassword123!');
    console.log('  STAFF LOGIN:');
    console.log('    Email:    staff@example.com');
    console.log('    Password: ChangeThisPassword123!');
    console.log('======================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('[Seed Error] Failed to seed database:', err);
    process.exit(1);
  }
};

seedData();
