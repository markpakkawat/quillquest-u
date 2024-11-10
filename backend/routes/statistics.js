// Backend: routes/statistics.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getMonthlyStats,
  getErrorStats,
  saveErrorStats,
  getWritingStats
} = require('../controllers/statisticsController');

// Base route: /api/statistics or /api/users/statistics
router.get('/monthly', protect, getMonthlyStats);
router.get('/errors', protect, getErrorStats);
router.post('/errors', protect, saveErrorStats);
router.get('/writing-stats', protect, getWritingStats);

module.exports = router;