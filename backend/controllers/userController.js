const User = require('../models/User');
const Post = require('../models/Post');

// ================ Helper Functions ================

const calculatePostsInPeriod = (posts, days) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return posts.filter(post => new Date(post.createdAt) >= cutoff).length;
};

const calculateTotalWords = (posts) => {
  return posts.reduce((sum, post) => {
    return sum + (post.content?.split(/\s+/).filter(w => w.length > 0).length || 0);
  }, 0);
};

const calculatePercentageChange = (oldValue, newValue, lowerIsBetter = false) => {
  if (!oldValue || !newValue) return 0;
  const change = ((newValue - oldValue) / oldValue) * 100;
  return Math.round(lowerIsBetter ? -change : change);
};

const calculateCompletedEssays = (posts) => {
  return posts.filter(post => 
    post.statistics?.completeness?.every(stat => stat.isComplete)
  ).length;
};

const calculateCompletionRate = (posts) => {
  if (!posts.length) return 0;
  const completed = calculateCompletedEssays(posts);
  return Math.round((completed / posts.length) * 100);
};

const calculateAverageClarity = (posts) => {
  if (!posts.length) return 0;
  const sum = posts.reduce((acc, post) => 
    acc + (post.statistics?.writingMetrics?.clarity?.score || 0), 0
  );
  return Math.round(sum / posts.length);
};

const calculateAverageComplexity = (posts) => {
  if (!posts.length) return 0;
  const sum = posts.reduce((acc, post) => 
    acc + (post.statistics?.writingMetrics?.complexity?.score || 0), 0
  );
  return Math.round(sum / posts.length);
};

const calculateAverageActiveVoice = (posts) => {
  if (!posts.length) return 0;
  const sum = posts.reduce((acc, post) => 
    acc + (post.statistics?.writingMetrics?.voice?.activeVoicePercentage || 0), 0
  );
  return Math.round(sum / posts.length);
};

const calculateErrorRate = (posts) => {
  if (!posts.length) return 0;
  const totalErrors = posts.reduce((sum, post) => 
    sum + (post.statistics?.overall?.totalErrors || 0), 0
  );
  const totalWords = calculateTotalWords(posts);
  // Remove the ternary and use a regular if statement
  if (totalWords) {
    return Math.round((totalErrors / totalWords) * 1000) / 10;
  }
  return 0;
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
        true
      )
    },
    {
      area: 'Vocabulary',
      percentage: calculatePercentageChange(
        firstPost.statistics?.writingMetrics?.complexity?.wordChoice?.academicVocabularyScore,
        lastPost.statistics?.writingMetrics?.complexity?.wordChoice?.academicVocabularyScore
      )
    }
  ].filter(imp => imp.percentage > 0);
};

const calculateFocusAreas = (posts) => {
  const recentPosts = posts.slice(-3);
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

const getSuggestion = (issue) => {
  const suggestions = {
    thesis: "Make your main argument clearer",
    evidence: "Add more supporting examples",
    transitions: "Improve paragraph connections",
    clarity: "Use clearer language and structure",
    complexity: "Vary your sentence structure",
    vocabulary: "Use more academic vocabulary"
  };
  return suggestions[issue] || "Focus on improving this area";
};

// ================ Controller Functions ================

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
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

const updateProfile = async (req, res, next) => {
  try {
    const user = req.user;
    const { username, email, password, avatar, avatarColor } = req.body;

    if (username) user.username = username;
    if (email) user.email = email;
    if (avatar) user.avatar = avatar;
    if (avatarColor) user.avatarColor = avatarColor;
    if (password) user.password = password;

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

const getUserProfileById = async (req, res, next) => {
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

const getMonthlyStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

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
        writingStats: {
          totalPosts: 0,
          averageWordCount: 0,
          completedEssays: 0,
          totalErrors: 0
        }
      });
    }

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

const getWritingStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const posts = await Post.find({
      userId: userId,
      createdAt: { $gte: threeMonthsAgo }
    }).sort({ createdAt: -1 });

    const stats = {
      recentActivity: {
        totalPosts: posts.length,
        postsThisMonth: calculatePostsInPeriod(posts, 30),
        postsThisWeek: calculatePostsInPeriod(posts, 7),
        lastPostDate: posts[0]?.createdAt || null
      },
      writingMetrics: {
        averageWordCount: calculateAverageWordCount(posts),
        totalWords: calculateTotalWords(posts),
        completedEssays: calculateCompletedEssays(posts),
        averageCompletionRate: calculateCompletionRate(posts)
      },
      qualityMetrics: {
        clarity: calculateAverageClarity(posts),
        complexity: calculateAverageComplexity(posts),
        activeVoice: calculateAverageActiveVoice(posts),
        errorRate: calculateErrorRate(posts)
      },
      improvement: {
        errorReduction: calculateErrorReduction(posts),
        clarityGain: calculateClarityImprovement(posts),
        complexityGain: posts.length >= 2 ? calculatePercentageChange(
          posts[posts.length - 1].statistics?.writingMetrics?.complexity?.score,
          posts[0].statistics?.writingMetrics?.complexity?.score
        ) : 0,
        activeVoiceImprovement: calculateActiveVoiceIncrease(posts)
      },
      topPerformance: {
        bestClarityScore: Math.max(...posts.map(p => 
          p.statistics?.writingMetrics?.clarity?.score || 0
        )),
        lowestErrorCount: Math.min(...posts.map(p => 
          p.statistics?.overall?.totalErrors || 0
        )),
        highestActiveVoice: Math.max(...posts.map(p => 
          p.statistics?.writingMetrics?.voice?.activeVoicePercentage || 0
        ))
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting writing stats:', error);
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getUserProfileById,
  getMonthlyStats,
  getWritingStats
};