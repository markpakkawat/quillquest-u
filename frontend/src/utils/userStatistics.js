import api from '../services/api';
import { analyzeWritingStyle, aggregateStyleAnalyses } from './writing/writingAnalysis';

// Get basic user statistics
export const getBasicStats = async () => {
  try {
    const response = await api.get('/posts/user');
    const userPosts = response.data;
    
    // Analyze each post's writing style
    const styleAnalyses = await Promise.all(
      userPosts.map(post => analyzeWritingStyle(post.content || ''))
    );

    // Calculate basic statistics
    const basicStats = {
      postsCount: userPosts.length,
      averageWordCount: userPosts.length > 0 
        ? Math.round(
            userPosts.reduce((acc, post) => 
              acc + (post.content ? post.content.split(/\s+/).length : 0), 0
            ) / userPosts.length
          )
        : 0,
      completedEssays: userPosts.filter(post => post.isComplete).length,
      completionRate: userPosts.length > 0
        ? Math.round(
            (userPosts.filter(post => post.isComplete).length / userPosts.length) * 100
          )
        : 0,
      writingStyle: aggregateStyleAnalyses(styleAnalyses),
      recentActivity: calculateRecentActivity(userPosts),
      averageWritingTime: calculateAverageWritingTime(userPosts)
    };

    return basicStats;
  } catch (error) {
    console.error('Error fetching basic stats:', error);
    return {
      postsCount: 0,
      averageWordCount: 0,
      completedEssays: 0,
      completionRate: 0,
      writingStyle: null,
      recentActivity: { lastWeek: 0, lastMonth: 0 },
      averageWritingTime: 0
    };
  }
};

// Get writing improvement statistics
export const getWritingStats = () => {
  try {
    const errorStats = JSON.parse(localStorage.getItem('errorStats') || '[]');
    const completenessStats = JSON.parse(localStorage.getItem('completenessStats') || '[]');
    
    return {
      errorReduction: calculateErrorReduction(errorStats),
      commonErrors: findCommonErrors(errorStats),
      sectionRates: calculateSectionRates(completenessStats),
      commonMissingRequirements: findCommonMissingRequirements(completenessStats),
      errorTrends: calculateErrorTrends(errorStats),
      completionTrends: calculateCompletionTrends(completenessStats)
    };
  } catch (error) {
    console.error('Error calculating writing stats:', error);
    return {
      errorReduction: 0,
      commonErrors: [],
      sectionRates: {},
      commonMissingRequirements: [],
      errorTrends: [],
      completionTrends: []
    };
  }
};

// Helper function to calculate error reduction
const calculateErrorReduction = (stats) => {
  if (stats.length < 2) return 0;
  
  const firstFive = stats.slice(0, Math.min(5, Math.floor(stats.length / 2)));
  const lastFive = stats.slice(-Math.min(5, Math.floor(stats.length / 2)));
  
  const earlyAvg = firstFive.reduce((sum, stat) => sum + stat.totalErrors, 0) / firstFive.length;
  const recentAvg = lastFive.reduce((sum, stat) => sum + stat.totalErrors, 0) / lastFive.length;
  
  return earlyAvg === 0 ? 0 : Math.round(((earlyAvg - recentAvg) / earlyAvg) * 100);
};

// Helper function to find common errors
const findCommonErrors = (stats) => {
  const errorCounts = {};
  stats.forEach(stat => {
    Object.entries(stat.errorsByCategory).forEach(([category, count]) => {
      errorCounts[category] = (errorCounts[category] || 0) + count;
    });
  });

  return Object.entries(errorCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
};

// Helper function to calculate section completion rates
const calculateSectionRates = (stats) => {
  const sectionCounts = {};
  const sectionCompletions = {};

  stats.forEach(stat => {
    const section = stat.sectionType;
    sectionCounts[section] = (sectionCounts[section] || 0) + 1;
    if (stat.isComplete) {
      sectionCompletions[section] = (sectionCompletions[section] || 0) + 1;
    }
  });

  return Object.keys(sectionCounts).reduce((acc, section) => {
    acc[section] = Math.round((sectionCompletions[section] || 0) / sectionCounts[section] * 100);
    return acc;
  }, {});
};

// Helper function to find common missing requirements
const findCommonMissingRequirements = (stats) => {
  const requirementCounts = {};
  stats.forEach(stat => {
    if (!stat.isComplete && stat.details?.completionStatus?.missing) {
      stat.details.completionStatus.missing.forEach(req => {
        requirementCounts[req] = (requirementCounts[req] || 0) + 1;
      });
    }
  });

  return Object.entries(requirementCounts)
    .map(([requirement, count]) => ({
      requirement,
      frequency: Math.round((count / stats.length) * 100)
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 6);
};

// Helper function to calculate error trends over time
const calculateErrorTrends = (stats) => {
  if (stats.length < 2) return [];

  return stats.map((stat, index) => ({
    date: new Date(stat.timestamp).toLocaleDateString(),
    totalErrors: stat.totalErrors,
    improvement: index > 0 
      ? Math.round(((stats[index - 1].totalErrors - stat.totalErrors) / 
          stats[index - 1].totalErrors) * 100)
      : 0
  }));
};

// Helper function to calculate completion trends
const calculateCompletionTrends = (stats) => {
  if (stats.length < 2) return [];

  const trendData = [];
  let completedCount = 0;

  stats.forEach((stat) => {
    if (stat.isComplete) completedCount++;
    trendData.push({
      date: new Date(stat.timestamp).toLocaleDateString(),
      completionRate: Math.round((completedCount / (trendData.length + 1)) * 100)
    });
  });

  return trendData;
};

// Helper function to calculate recent activity
const calculateRecentActivity = (posts) => {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    lastWeek: posts.filter(post => new Date(post.createdAt) > oneWeekAgo).length,
    lastMonth: posts.filter(post => new Date(post.createdAt) > oneMonthAgo).length
  };
};

// Helper function to calculate average writing time
const calculateAverageWritingTime = (posts) => {
  const timesWithData = posts.filter(post => post.startTime && post.endTime);
  if (timesWithData.length === 0) return 0;

  const totalMinutes = timesWithData.reduce((sum, post) => {
    const duration = new Date(post.endTime) - new Date(post.startTime);
    return sum + (duration / (1000 * 60)); // Convert to minutes
  }, 0);

  return Math.round(totalMinutes / timesWithData.length);
};

export {
  calculateErrorReduction,
  findCommonErrors,
  calculateSectionRates,
  findCommonMissingRequirements,
  calculateErrorTrends,
  calculateCompletionTrends,
  calculateRecentActivity
};