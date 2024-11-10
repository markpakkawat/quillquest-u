// backend/routes/users.js

const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getUserProfileById, checkEmailAvailability } = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

// @route   GET /api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', protect, getProfile);

// @route   PUT /api/users/profile
// @desc    Update current user's profile
// @access  Private
router.put('/profile', protect, updateProfile);

// @route   GET /api/users/:userId/profile
// @desc    Get a user's profile by ID
// @access  Private
router.get('/:userId/profile', protect, getUserProfileById);

router.get('/check-email', checkEmailAvailability);

module.exports = router;
