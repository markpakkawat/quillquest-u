const express = require('express');
const router = express.Router();
const { 
  getProfile, 
  updateProfile, 
  getUserProfileById,
  getMonthlyStats,
  getWritingStats,
  checkEmailAvailability 
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

// Profile routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/:userId/profile', protect, getUserProfileById);

// Statistics routes
router.get('/monthly-stats', protect, getMonthlyStats);
router.get('/writing-stats', protect, getWritingStats);

// Email availability route (public)
router.get('/check-email', checkEmailAvailability);

module.exports = router;