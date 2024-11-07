// backend/routes/users.js
const express = require('express');
const router = express.Router();
const { 
  getProfile, 
  updateProfile, 
  getUserProfileById,
  getMonthlyStats,  // Add this new controller
  getWritingStats
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

// Existing routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/:userId/profile', protect, getUserProfileById);

// New statistics route
// @route   GET /api/users/monthly-stats
// @desc    Get user's monthly writing statistics
// @access  Private
router.get('/monthly-stats', protect, getMonthlyStats);
router.get('/writing-stats', protect, getWritingStats);

module.exports = router;