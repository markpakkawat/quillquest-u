// backend/controllers/statisticsController.js
const User = require('../models/User');
const Post = require('../models/Post');

const getMonthlyStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const posts = await Post.find({
      userId: userId,
      createdAt: { $gte: threeMonthsAgo }
    }).sort({ createdAt: 1 });

    if (!posts.length) {
      return res.json({
        qualityTrends: [],
        improvements: [],
        focusAreas: [],
        overallProgress: {
          errorReduction: 0,
          clarityImprovement: 0,
          activeVoiceIncrease: 0
        },
        writingMetrics: {
          totalPosts: 0,
          averageWordCount: 0,
          completedEssays: 0
        }
      });
    }

    // These match the actual metrics we're storing from essayChecker and writingAnalysis
    const statistics = {
      qualityTrends: posts.map(post => ({
        date: post.createdAt,
        // From essayChecker
        errors: {
          spelling: post.statistics?.errorsByCategory?.spelling || 0,
          punctuation: post.statistics?.errorsByCategory?.punctuation || 0,
          lexicoSemantic: post.statistics?.errorsByCategory?.lexicoSemantic || 0,
          stylistic: post.statistics?.errorsByCategory?.stylistic || 0,
          typographical: post.statistics?.errorsByCategory?.typographical || 0
        },
        // From writingAnalysis
        writing: {
          clarity: post.statistics?.writingMetrics?.clarity?.score || 0,
          tone: post.statistics?.writingMetrics?.tone?.type || 'N/A',
          activeVoice: post.statistics?.writingMetrics?.voice?.activeVoicePercentage || 0
        },
        // From sectionCompleteness
        requirements: {
          met: post.statistics?.sections?.reduce((sum, section) => 
            sum + (section.requirements?.met?.length || 0), 0) || 0,
          total: post.statistics?.sections?.reduce((sum, section) => 
            sum + ((section.requirements?.met?.length || 0) + 
                   (section.requirements?.missing?.length || 0)), 0) || 0
        }
      })),
      improvements: post.statistics?.improvements || [],
      focusAreas: post.statistics?.commonMissingRequirements || [],
      overallProgress: {
        errorReduction: post.statistics?.errorReduction || 0,
        clarityImprovement: post.statistics?.clarityImprovement || 0,
        activeVoiceIncrease: post.statistics?.activeVoiceIncrease || 0
      }
    };

    res.json(statistics);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
};

module.exports = {
  getMonthlyStats
};