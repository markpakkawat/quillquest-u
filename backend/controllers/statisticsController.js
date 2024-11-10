const Post = require('../models/Post');
const Statistics = require('../models/Statistics');

const calculateImprovements = (posts) => {
  if (posts.length < 2) return [];
  
  const firstPost = posts[0];
  const lastPost = posts[posts.length - 1];
  
  return [
    {
      metric: 'Writing Clarity',
      change: ((lastPost.statistics?.writingMetrics?.clarity || 0) - 
               (firstPost.statistics?.writingMetrics?.clarity || 0)).toFixed(1)
    },
    {
      metric: 'Error Reduction',
      change: ((firstPost.statistics?.writingMetrics?.errorRate || 0) - 
               (lastPost.statistics?.writingMetrics?.errorRate || 0)).toFixed(1)
    },
    {
      metric: 'Active Voice Usage',
      change: ((lastPost.statistics?.writingMetrics?.activeVoice || 0) - 
               (firstPost.statistics?.writingMetrics?.activeVoice || 0)).toFixed(1)
    }
  ];
};

const calculateFocusAreas = (posts) => {
  const latestPost = posts[posts.length - 1];
  const metrics = latestPost.statistics?.writingMetrics || {};
  
  const areas = [
    { name: 'Clarity', score: metrics.clarity || 0 },
    { name: 'Active Voice', score: metrics.activeVoice || 0 },
    { name: 'Error Rate', score: metrics.errorRate || 0 }
  ].sort((a, b) => a.score - b.score);
  
  return areas.slice(0, 3);
};

const calculateOverallProgress = (posts) => {
  const initialMetrics = posts[0].statistics?.writingMetrics || {};
  const currentMetrics = posts[posts.length - 1].statistics?.writingMetrics || {};
  
  return {
    errorReduction: Math.round(((initialMetrics.errorRate || 0) - 
                               (currentMetrics.errorRate || 0)) * 100) / 100,
    clarityImprovement: Math.round(((currentMetrics.clarity || 0) - 
                                   (initialMetrics.clarity || 0)) * 100) / 100,
    activeVoiceIncrease: Math.round(((currentMetrics.activeVoice || 0) - 
                                    (initialMetrics.activeVoice || 0)) * 100) / 100
  };
};

const calculateAllStats = (posts) => {
  const now = new Date();
  const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
  const weekAgo = new Date(now.setDate(now.getDate() - 7));

  // Calculate total errors and words
  const totalErrors = posts.reduce((sum, post) => {
    return sum + (post.statistics?.overall?.totalErrors || 0);
  }, 0);

  const totalWords = posts.reduce((sum, post) => {
    return sum + (post.content ? post.content.split(/\s+/).filter(word => word.length > 0).length : 0);
  }, 0);

  // Calculate error rate as errors per word
  const errorRate = totalWords > 0 ? totalErrors / totalWords : 0;
  console.log('Error rate calculation:', { totalErrors, totalWords, errorRate });

  // Get the latest post's statistics
  const latestPost = posts[posts.length - 1];
  const latestStats = latestPost?.statistics?.writingMetrics || {};
  
  return {
    recentActivity: {
      totalPosts: posts.length,
      postsThisMonth: posts.filter(post => new Date(post.createdAt) > monthAgo).length,
      postsThisWeek: posts.filter(post => new Date(post.createdAt) > weekAgo).length,
      lastPostDate: posts[0]?.createdAt
    },
    writingMetrics: {
      averageWordCount: Math.round(totalWords / posts.length),
      totalWords,
      completedEssays: posts.filter(post => post.statistics?.isComplete).length,
      averageCompletionRate: latestStats.completionRate || 0
    },
    qualityMetrics: {
      clarity: latestStats.clarity || 0,
      complexity: latestStats.complexity || 0,
      activeVoice: latestStats.activeVoice || 0,
      errorRate: errorRate // Updated error rate calculation
    },
    improvement: {
      errorReduction: calculateOverallProgress(posts).errorReduction,
      clarityGain: calculateOverallProgress(posts).clarityImprovement,
      complexityGain: Math.round(((latestStats.complexity || 0) - 
                                 (posts[0]?.statistics?.writingMetrics?.complexity || 0)) * 100) / 100,
      activeVoiceImprovement: calculateOverallProgress(posts).activeVoiceIncrease
    },
    topPerformance: {
      bestClarityScore: Math.max(...posts.map(p => 
        p.statistics?.writingMetrics?.clarity || 0
      )),
      lowestErrorCount: Math.min(...posts.map(p => 
        p.statistics?.writingMetrics?.errorRate || Number.MAX_VALUE
      )),
      highestActiveVoice: Math.max(...posts.map(p => 
        p.statistics?.writingMetrics?.activeVoice || 0
      ))
    }
  };
};

const getMonthlyStats = async (req, res) => {
  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const posts = await Post.find({
      userId: req.user.id,
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
          completedEssays: 0,
          totalErrors: 0
        }
      });
    }

    const stats = {
      qualityTrends: posts.map(post => ({
        date: post.createdAt,
        clarity: post.statistics?.writingMetrics?.clarity?.score || 0,
        complexity: post.statistics?.writingMetrics?.complexity?.score || 0,
        errors: post.statistics?.overall?.totalErrors || 0,
        wordCount: post.content?.split(/\s+/).length || 0
      })),
      improvements: calculateImprovements(posts),
      focusAreas: calculateFocusAreas(posts),
      overallProgress: calculateOverallProgress(posts)
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting monthly stats:', error);
    res.status(500).json({ message: 'Error getting monthly statistics' });
  }
};

const getErrorStats = async (req, res) => {
  try {
    const post = await Post.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
    if (!post || !post.statistics?.errors) {
      return res.json([]);
    }
    res.json(post.statistics.errors);
  } catch (error) {
    console.error('Error getting error stats:', error);
    res.status(500).json({ message: 'Error getting error stats' });
  }
};

const saveErrorStats = async (req, res) => {
  try {
    const { sectionId, totalErrors, errorsByCategory, detailedErrors, sectionType } = req.body;
    if (!sectionId || !sectionType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const post = await Post.findOne({
      userId: req.user.id,
      'sections.id': sectionId
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Calculate word count for error rate
    const section = post.sections.find(s => s.id === sectionId);
    const wordCount = section?.content ? 
      section.content.split(/\s+/).filter(word => word.length > 0).length : 0;

    const newErrorStats = {
      sectionId,
      sectionType,
      timestamp: new Date(),
      totalErrors: totalErrors || 0,
      errorsByCategory: errorsByCategory || {},
      detailedErrors: detailedErrors || [],
      wordCount,
      errorRate: wordCount > 0 ? (totalErrors || 0) / wordCount : 0
    };

    if (!post.statistics) {
      post.statistics = { errors: [], overall: { totalErrors: 0 } };
    }

    post.statistics.errors.push(newErrorStats);
    await post.save();

    res.json(newErrorStats);
  } catch (error) {
    console.error('Error saving error stats:', error);
    res.status(500).json({ message: 'Error saving error stats' });
  }
};

const getWritingStats = async (req, res) => {
  try {
    const userPosts = await Post.find({ userId: req.user.id }).sort({ createdAt: -1 });
    
    if (!userPosts.length) {
      return res.json({
        recentActivity: {
          totalPosts: 0,
          postsThisMonth: 0,
          postsThisWeek: 0,
          lastPostDate: null
        },
        writingMetrics: {
          averageWordCount: 0,
          totalWords: 0,
          completedEssays: 0,
          averageCompletionRate: 0
        },
        qualityMetrics: {
          clarity: 0,
          complexity: 0,
          activeVoice: 0,
          errorRate: 0
        },
        improvement: {
          errorReduction: 0,
          clarityGain: 0,
          complexityGain: 0,
          activeVoiceImprovement: 0
        },
        topPerformance: {
          bestClarityScore: 0,
          lowestErrorCount: 0,
          highestActiveVoice: 0
        }
      });
    }

    // Calculate metrics with word-based error rate
    const stats = calculateAllStats(userPosts);
    console.log('Calculated writing stats:', stats); // Add logging
    res.json(stats);
  } catch (error) {
    console.error('Error getting writing stats:', error);
    res.status(500).json({ message: 'Error getting writing stats' });
  }
};

module.exports = {
  getMonthlyStats,
  getErrorStats,
  saveErrorStats,
  getWritingStats
};