const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Helper: Ensure default Admin & Staff accounts exist in DB if missing
const ensureDefaultUsers = async () => {
  try {
    let admin = await User.findOne({ email: 'admin@example.com' });
    if (!admin) {
      admin = await User.create({
        name: 'System Admin',
        email: 'admin@example.com',
        password: 'ChangeThisPassword123!',
        role: 'admin',
        isActive: true,
      });
      console.log('[Auto-Heal] Created default Admin user account in DB');
    }

    let staff = await User.findOne({ email: 'staff@example.com' });
    if (!staff) {
      staff = await User.create({
        name: 'Store Staff',
        email: 'staff@example.com',
        password: 'ChangeThisPassword123!',
        role: 'staff',
        isActive: true,
      });
      console.log('[Auto-Heal] Created default Staff user account in DB');
    }
  } catch (err) {
    console.error('[Auto-Heal Warning] Failed to ensure default users:', err.message);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
        error: 'MISSING_CREDENTIALS',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Auto-provision default accounts if DB is fresh or empty
    await ensureDefaultUsers();

    let user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact an administrator.',
        error: 'ACCOUNT_DEACTIVATED',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS',
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, getMe };
