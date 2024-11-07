const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const statisticsController = require('../controllers/statisticsController');

// Main routes
router.get('/errors', protect, statisticsController.getErrorStats);
router.get('/monthly', protect, statisticsController.getMonthlyStats);
router.get('/writing-stats', protect, statisticsController.getWritingStats);

// Analysis routes
router.get('/analysis/conclusion', protect, statisticsController.getConclusionAnalysis);
router.get('/analysis/body-:timestamp', protect, statisticsController.getBodyAnalysis);
router.get('/analysis/:sectionId', protect, statisticsController.getWritingAnalysis);

// Statistics saving routes
router.post('/errors', protect, statisticsController.saveErrorStats);
router.post('/completeness', protect, statisticsController.saveCompletenessStats);
router.post('/analysis/:sectionId', protect, statisticsController.saveWritingAnalysis);

module.exports = router;