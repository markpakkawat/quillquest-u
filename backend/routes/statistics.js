// routes/statistics.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const Post = require('../models/Post');

// Get monthly statistics
router.get('/monthly', protect, async (req, res) => {
  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Get posts with their stored statistics
    const posts = await Post.find({
      userId: req.user.id,
      createdAt: { $gte: threeMonthsAgo }
    }).sort({ createdAt: 1 })
    .select('statistics createdAt content'); // Only select needed fields

    // For new users with no posts
    if (!posts.length) {
      return res.json({
        qualityTrends: [],
        improvements: [],
        focusAreas: [],
        overallProgress: {
          errorReduction: 0,
          clarityImprovement: 0
        }
      });
    }

    // Use the actual statistics stored in posts
    const monthlyStats = {
      qualityTrends: posts.map(post => ({
        date: post.createdAt,
        errors: post.statistics?.overall?.totalErrors || 0,
        clarity: post.statistics?.writingMetrics?.clarity?.score || 0,
        completeness: post.statistics?.overall?.requirementsMet / 
                     post.statistics?.overall?.requirementsTotal * 100 || 0
      })),
      improvements: posts[posts.length - 1].statistics?.improvements || [],
      focusAreas: posts[posts.length - 1].statistics?.commonMissingRequirements || [],
      overallProgress: posts[posts.length - 1].statistics?.overallProgress || {
        errorReduction: 0,
        clarityImprovement: 0
      }
    };

    res.json(monthlyStats);
  } catch (err) {
    console.error('Error fetching statistics:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;