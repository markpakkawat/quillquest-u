// routes/notificationRoutes.js

const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, deleteNotification } = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

// @route GET /api/notifications
// @desc Get all notifications for a user
// @access Private
router.get('/', protect, getNotifications);

// @route PUT /api/notifications/:id/read
// @desc Mark a notification as read
// @access Private
router.put('/:id/read', protect, markAsRead);

// @route DELETE /api/notifications/:id
// @desc Delete a notification
// @access Private
router.delete('/:id', protect, deleteNotification);

module.exports = router;
