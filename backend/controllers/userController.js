// backend/controllers/userController.js

const User = require('../models/User');
const Post = require('../models/Post'); // Add this import

// @desc    Get current user's profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId); // From protect middleware
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      avatarColor: user.avatarColor,
      createdAt: user.createdAt
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user's profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const user = req.user; // From protect middleware
    const { username, email, password, avatar, avatarColor } = req.body;

    if (username) user.username = username;
    if (email) user.email = email;
    if (avatar) user.avatar = avatar;
    if (avatarColor) user.avatarColor = avatarColor;
    if (password) user.password = password; // Will be hashed via pre-save hook

    await user.save();

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      avatarColor: user.avatarColor,
      createdAt: user.createdAt
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a user's profile by ID
// @route   GET /api/users/:userId/profile
// @access  Private
exports.getUserProfileById = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user._id,
      username: user.username,
      avatarColor: user.avatarColor,
      createdAt: user.createdAt
    });
  } catch (error) {
    next(error);
  }
};

exports.getMonthlyStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // First check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's posts from the last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const posts = await Post.find({
      userId: userId,
      createdAt: { $gte: threeMonthsAgo }
    }).sort({ createdAt: 1 });

    // Default stats for new users or users with no posts
    const defaultStats = {
      qualityTrends: [],
      improvements: [],
      focusAreas: [],
      overallProgress: {
        errorReduction: 0,
        clarityImprovement: 0,
        activeVoiceIncrease: 0
      },
      writingStats: {
        totalPosts: 0,
        averageWordCount: 0,
        completedEssays: 0,
        totalErrors: 0
      }
    };

    // If no posts, return default stats
    if (!posts.length) {
      return res.json(defaultStats);
    }

    // Calculate stats from posts
    const statistics = {
      qualityTrends: posts.map(post => ({
        date: post.createdAt,
        clarity: post.statistics?.writingMetrics?.clarity?.score || 0,
        complexity: post.statistics?.writingMetrics?.complexity?.score || 0,
        errors: post.statistics?.overall?.totalErrors || 0,
        wordCount: post.content?.split(/\s+/).length || 0
      })),

      improvements: calculateImprovements(posts),
      
      focusAreas: calculateFocusAreas(posts),

      overallProgress: {
        errorReduction: calculateErrorReduction(posts),
        clarityImprovement: calculateClarityImprovement(posts),
        activeVoiceIncrease: calculateActiveVoiceIncrease(posts)
      },

      writingStats: {
        totalPosts: posts.length,
        averageWordCount: calculateAverageWordCount(posts),
        completedEssays: posts.filter(post => 
          post.statistics?.overall?.requirementsMet === post.statistics?.overall?.requirementsTotal
        ).length,
        totalErrors: posts.reduce((sum, post) => 
          sum + (post.statistics?.overall?.totalErrors || 0), 0)
      }
    };

    res.json(statistics);
  } catch (error) {
    next(error);
  }
};

// Helper functions
const calculateImprovements = (posts) => {
  if (posts.length < 2) return [];
  
  const firstPost = posts[0];
  const lastPost = posts[posts.length - 1];
  
  return [
    {
      area: 'Writing Clarity',
      percentage: calculatePercentageChange(
        firstPost.statistics?.writingMetrics?.clarity?.score,
        lastPost.statistics?.writingMetrics?.clarity?.score
      )
    },
    {
      area: 'Error Reduction',
      percentage: calculatePercentageChange(
        firstPost.statistics?.overall?.totalErrors,
        lastPost.statistics?.overall?.totalErrors,
        true // lower is better
      )
    },
    {
      area: 'Vocabulary',
      percentage: calculatePercentageChange(
        firstPost.statistics?.writingMetrics?.complexity?.wordChoice?.academicVocabularyScore,
        lastPost.statistics?.writingMetrics?.complexity?.wordChoice?.academicVocabularyScore
      )
    }
  ].filter(imp => imp.percentage > 0); // Only show positive improvements
};

const calculateFocusAreas = (posts) => {
  const recentPosts = posts.slice(-3); // Look at last 3 posts
  const commonIssues = {};
  
  recentPosts.forEach(post => {
    post.statistics?.sections?.forEach(section => {
      if (section.requirements?.missing) {
        section.requirements.missing.forEach(req => {
          commonIssues[req] = (commonIssues[req] || 0) + 1;
        });
      }
    });
  });

  return Object.entries(commonIssues)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([issue]) => ({
      name: issue,
      suggestion: getSuggestion(issue)
    }));
};

const calculatePercentageChange = (oldValue, newValue, lowerIsBetter = false) => {
  if (!oldValue || !newValue) return 0;
  const change = ((newValue - oldValue) / oldValue) * 100;
  return Math.round(lowerIsBetter ? -change : change);
};

const calculateErrorReduction = (posts) => {
  if (posts.length < 2) return 0;
  const first = posts[0].statistics?.overall?.totalErrors || 0;
  const last = posts[posts.length - 1].statistics?.overall?.totalErrors || 0;
  return first === 0 ? 0 : Math.round(((first - last) / first) * 100);
};

const calculateClarityImprovement = (posts) => {
  if (posts.length < 2) return 0;
  const first = posts[0].statistics?.writingMetrics?.clarity?.score || 0;
  const last = posts[posts.length - 1].statistics?.writingMetrics?.clarity?.score || 0;
  return first === 0 ? 0 : Math.round(((last - first) / first) * 100);
};

const calculateActiveVoiceIncrease = (posts) => {
  if (posts.length < 2) return 0;
  const first = posts[0].statistics?.writingMetrics?.voice?.activeVoicePercentage || 0;
  const last = posts[posts.length - 1].statistics?.writingMetrics?.voice?.activeVoicePercentage || 0;
  return first === 0 ? 0 : Math.round(((last - first) / first) * 100);
};

const calculateAverageWordCount = (posts) => {
  return Math.round(posts.reduce((sum, post) => 
    sum + (post.content?.split(/\s+/).length || 0), 0) / posts.length);
};

const getSuggestion = (issue) => {
  const suggestions = {
    thesis: "Make your main argument clearer",
    evidence: "Add more supporting examples",
    transitions: "Improve paragraph connections",
    clarity: "Use clearer language and structure",
    complexity: "Vary your sentence structure",
    vocabulary: "Use more academic vocabulary",
    // Add more as needed
  };
  return suggestions[issue] || "Focus on improving this area";
};

module.exports = exports;
