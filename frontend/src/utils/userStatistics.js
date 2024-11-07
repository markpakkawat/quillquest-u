import api from '../services/api';
import { 
  calculateSectionRates, 
  findCommonMissingRequirements, 
  calculateErrorTrends,
  getErrorStats 
} from './errorTracking';

// Fetch user statistics from the backend
export const fetchUserStats = async () => {
  try {
    const response = await api.get('/user/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
};

// Store user statistics to the backend
export const storeUserStats = async (stats) => {
  try {
    const response = await api.post('/user/stats', stats);
    return response.data;
  } catch (error) {
    console.error('Error storing user stats:', error);
    throw error;
  }
};

// Main function to get all writing statistics
export const getWritingStats = async () => {
  try {
    // Get all sections from localStorage
    const essaySections = JSON.parse(localStorage.getItem('essaySections') || '[]');
    
    // No sections = return empty stats
    if (!essaySections.length) {
      return getEmptyStats();
    }

    // Get error stats from storage
    const errorStats = JSON.parse(localStorage.getItem('errorStats') || '[]');
    
    // Get completeness stats from storage
    const completenessStats = JSON.parse(localStorage.getItem('completenessStats') || '[]');

    // Calculate current errors
    const currentErrors = {};
    errorStats.forEach(stat => {
      Object.entries(stat.errorsByCategory || {}).forEach(([category, count]) => {
        currentErrors[category] = (currentErrors[category] || 0) + count;
      });
    });

    return {
      currentErrors,
      totalErrors: errorStats.reduce((sum, stat) => sum + (stat.totalErrors || 0), 0),
      errorTrends: calculateErrorTrends(errorStats),
      sectionRates: calculateSectionRates(completenessStats),
      commonMissingRequirements: findCommonMissingRequirements(completenessStats),
      completionStatus: {
        totalSections: completenessStats.length,
        completedSections: completenessStats.filter(stat => stat.isComplete).length,
        completionRate: calculateCompletionRate(completenessStats)
      },
      sectionStats: formatSectionStats(calculateSectionRates(completenessStats))
    };
  } catch (error) {
    console.error('Error calculating writing stats:', error);
    return getEmptyStats();
  }
};

// Add this helper function if not already present
const calculateCompletionRate = (stats) => {
  if (!stats.length) return 0;
  const completed = stats.filter(stat => stat.isComplete).length;
  return Math.round((completed / stats.length) * 100);
};

const getEmptyStats = () => ({
  currentErrors: {},
  totalErrors: 0,
  errorTrends: [],
  sectionRates: {},
  commonMissingRequirements: [],
  completionStatus: {
    totalSections: 0,
    completedSections: 0,
    completionRate: 0
  },
  sectionStats: []
});

// Get completion statistics
const getCompletionStats = (completenessStats) => {
  const sectionRates = calculateSectionRates(completenessStats);
  
  return {
    sectionRates,
    commonMissingRequirements: findCommonMissingRequirements(completenessStats),
    completionStatus: {
      totalSections: completenessStats.length,
      completedSections: completenessStats.filter(stat => stat.isComplete).length,
      completionRate: calculateCompletionRate(completenessStats)
    },
    sectionStats: formatSectionStats(sectionRates)
  };
};

// Format section statistics
const formatSectionStats = (sectionRates) => 
  Object.entries(sectionRates).map(([type, rate]) => ({
    type,
    rate
  }));

// Time formatting utility
export const formatWritingTime = (ms) => {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) {
    return `${Math.round(ms / 1000)}s`;
  }
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes}m`;
};