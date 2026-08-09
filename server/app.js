const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const salesRoutes = require('./routes/salesRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5188';
app.use(
  cors({
    origin: '*', // Allow all client origins in production API
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    error: 'TOO_MANY_REQUESTS',
  },
});
app.use('/api', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Welcome API Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'LPG Cooking Gas Inventory System Backend API is Live & Running!',
    healthCheck: '/api/health',
    timestamp: new Date().toISOString(),
  });
});

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'LPG Inventory Management System API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// API Routes Mount
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    error: 'NOT_FOUND',
  });
});

// Centralized Error Middleware
app.use(errorHandler);

module.exports = app;
