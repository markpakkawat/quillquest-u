// Backend: routes/statistics.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const statisticsController = require('../controllers/statisticsController');

// Base route: /api/statistics
router.get('/analysis/conclusion', protect, statisticsController.getConclusionAnalysis);
router.get('/users/statistics/analysis/conclusion', protect, statisticsController.getConclusionAnalysis);
router.get('/users/statistics/analysis/body-:timestamp', protect, statisticsController.getBodyAnalysis);
router.get('/users/statistics/analysis/:sectionId', protect, statisticsController.getWritingAnalysis);

router.get('/errors', protect, statisticsController.getErrorStats);
router.get('/monthly', protect, statisticsController.getMonthlyStats);
router.post('/errors', protect, statisticsController.saveErrorStats);
router.post('/completeness', protect, statisticsController.saveCompletenessStats);

module.exports = router;

