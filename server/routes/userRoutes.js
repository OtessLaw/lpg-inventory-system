const express = require('express');
const {
  getUsers,
  createUser,
  updateUser,
  toggleUserStatus,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin')); // Strictly enforce Admin role on backend!

router.route('/').get(getUsers).post(createUser);
router.route('/:id').put(updateUser);
router.route('/:id/status').patch(toggleUserStatus);

module.exports = router;
