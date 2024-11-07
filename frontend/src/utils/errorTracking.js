import api from '../services/api';

export const ERROR_CATEGORIES = {
  spelling: 'Spelling',
  punctuation: 'Punctuation',
  lexicoSemantic: 'Word Choice & Meaning',
  stylistic: 'Style',
  typographical: 'Typography'
};

export const SECTION_TYPES = {
  introduction: 'Introduction',
  bodyParagraph: 'Body Paragraph',
  conclusion: 'Conclusion'
};

// In errorTracking.js, add this new endpoint to your ENDPOINTS object:
const ENDPOINTS = {
  errors: '/statistics/errors',
  completeness: '/statistics/completeness',
  userStats: '/statistics/monthly',
  writingAnalysis: '/statistics/analysis'  // Remove the template literal
};

// Update the saveWritingAnalysis function
export const saveWritingAnalysis = async (sectionId, analysisData) => {
  try {
    // Try API first
    try {
      const response = await api.post(`${ENDPOINTS.writingAnalysis}/${sectionId}`, analysisData);
      return response.data;
    } catch (apiError) {
      console.warn('Failed to save writing analysis to API, falling back to localStorage');
      // Fallback to localStorage
      localStorage.setItem(`writingAnalysis_${sectionId}`, JSON.stringify(analysisData));
      return analysisData;
    }
  } catch (error) {
    console.error('Error saving writing analysis:', error);
    throw error;
  }
};

// Update the getWritingAnalysis function
export const getWritingAnalysis = async (sectionId) => {
  try {
    let endpoint;
    if (sectionId === 'conclusion') {
      endpoint = '/statistics/analysis/conclusion';
    } else if (sectionId.startsWith('body-')) {
      endpoint = `/statistics/analysis/${sectionId}`;
    } else {
      endpoint = `/statistics/analysis/${sectionId}`;
    }

    try {
      // Try API first
      const response = await api.get(endpoint);
      return response.data;
    } catch (apiError) {
      console.warn('Failed to get writing analysis from API, falling back to localStorage');
      // Fallback to localStorage
      const data = localStorage.getItem(`writingAnalysis_${sectionId}`);
      if (data) {
        return JSON.parse(data);
      }

      // If no data in localStorage, return default structure
      return {
        tone: {
          type: "Analyzing...",
          confidence: 0,
          characteristics: []
        },
        voice: {
          type: "Mixed",
          activeVoicePercentage: 0,
          passiveVoiceInstances: 0
        },
        clarity: {
          score: 0,
          level: "Analyzing...",
          strengths: [],
          improvements: []
        },
        complexity: {
          sentenceStructure: {
            score: 0,
            averageLength: 0,
            varietyScore: 0
          },
          wordChoice: {
            complexWordsPercentage: 0,
            academicVocabularyScore: 0
          },
          paragraphCohesion: {
            score: 0,
            transitionStrength: "Analyzing...",
            logicalFlowScore: 0
          }
        }
      };
    }
  } catch (error) {
    console.error('Error getting writing analysis:', error);
    return null;
  }
};

const saveToLocalStorage = (key, data) => {
  try {
    const existingData = JSON.parse(localStorage.getItem(key) || '[]');
    existingData.push({
      ...data,
      savedAt: new Date().toISOString(),
      isPending: true
    });
    localStorage.setItem(key, JSON.stringify(existingData));
    console.log(`Saved to localStorage: ${key}`, data);
    return true;
  } catch (error) {
    console.error(`Failed to save to localStorage: ${key}`, error);
    return false;
  }
};

export const saveErrorStats = async (sectionId, errors, sectionType) => {
  try {
    if (!sectionId || !errors || !sectionType) {
      console.error('Invalid parameters:', { sectionId, errors, sectionType });
      throw new Error('Missing required parameters');
    }

    // Transform array of errors into category counts
    const errorsByCategory = {};
    Object.entries(errors).forEach(([category, categoryErrors]) => {
      if (Array.isArray(categoryErrors)) {
        errorsByCategory[category] = categoryErrors.length;
      }
    });
    
    // Create stats object
    const statsData = {
      sectionId,
      sectionType,
      timestamp: new Date().toISOString(),
      totalErrors: Object.values(errorsByCategory).reduce((sum, count) => sum + count, 0),
      errorsByCategory,
      detailedErrors: Object.values(errors).flat()
    };

    console.log('Saving error stats locally:', statsData);
    return saveToLocalStorage('errorStats', statsData);

  } catch (error) {
    console.error('Error in saveErrorStats:', error);
    return false;
  }
};

export const saveCompletenessStats = async (sectionId, completenessData, sectionType) => {
  try {
    if (!sectionId || !completenessData || !sectionType) {
      console.error('Invalid parameters:', { sectionId, completenessData, sectionType });
      throw new Error('Missing required parameters');
    }

    // Create stats object
    const statsData = {
      sectionId,
      sectionType,
      timestamp: new Date().toISOString(),
      isComplete: completenessData.isComplete,
      metRequirements: completenessData.completionStatus?.met?.length || 0,
      missingRequirements: completenessData.completionStatus?.missing?.length || 0,
      details: completenessData
    };

    console.log('Saving completeness stats locally:', statsData);
    return saveToLocalStorage('completenessStats', statsData);

  } catch (error) {
    console.error('Error in saveCompletenessStats:', error);
    return false;
  }
};

// Helper function to sync all pending stats when post is created
export const syncAllPendingStats = async (postId) => {
  try {
    // Sync error stats
    const errorStats = JSON.parse(localStorage.getItem('errorStats') || '[]');
    const pendingErrorStats = errorStats.filter(stat => stat.isPending);
    
    // Sync completeness stats
    const completenessStats = JSON.parse(localStorage.getItem('completenessStats') || '[]');
    const pendingCompletenessStats = completenessStats.filter(stat => stat.isPending);
    
    if (pendingErrorStats.length === 0 && pendingCompletenessStats.length === 0) {
      console.log('No pending stats to sync');
      return;
    }

    console.log('Syncing pending stats for post:', postId);

    // Sync error stats
    for (const stat of pendingErrorStats) {
      try {
        await api.post('/statistics/errors', {
          ...stat,
          postId
        });
        stat.isPending = false;
        stat.syncedAt = new Date().toISOString();
      } catch (error) {
        console.error('Failed to sync error stat:', error);
      }
    }

    // Sync completeness stats
    for (const stat of pendingCompletenessStats) {
      try {
        await api.post('/statistics/completeness', {
          ...stat,
          postId
        });
        stat.isPending = false;
        stat.syncedAt = new Date().toISOString();
      } catch (error) {
        console.error('Failed to sync completeness stat:', error);
      }
    }

    // Update localStorage with sync status
    localStorage.setItem('errorStats', JSON.stringify(errorStats));
    localStorage.setItem('completenessStats', JSON.stringify(completenessStats));
    
    console.log('Finished syncing all pending stats');

  } catch (error) {
    console.error('Error syncing pending stats:', error);
  }
};

// Helper functions to get stats
export const getErrorStats = () => {
  try {
    return JSON.parse(localStorage.getItem('errorStats') || '[]');
  } catch (error) {
    console.error('Error getting error stats:', error);
    return [];
  }
};

export const getCompletenessStats = () => {
  try {
    return JSON.parse(localStorage.getItem('completenessStats') || '[]');
  } catch (error) {
    console.error('Error getting completeness stats:', error);
    return [];
  }
};

// Helper function to sync pending stats when post is created
export const syncPendingStats = async (postId) => {
  try {
    const errorStats = JSON.parse(localStorage.getItem('errorStats') || '[]');
    const pendingStats = errorStats.filter(stat => stat.isPending);
    
    if (pendingStats.length === 0) return;

    console.log('Syncing pending stats for post:', postId);

    for (const stat of pendingStats) {
      try {
        await api.post('/statistics/errors', {
          ...stat,
          postId
        });
        
        // Mark as synced
        stat.isPending = false;
        stat.syncedAt = new Date().toISOString();
      } catch (error) {
        console.error('Failed to sync stat:', error);
      }
    }

    // Update localStorage with sync status
    localStorage.setItem('errorStats', JSON.stringify(errorStats));

  } catch (error) {
    console.error('Error syncing pending stats:', error);
  }
};

// Convert categorized errors to array if needed
const normalizeErrors = (errors) => {
  // If it's already an array, return it
  if (Array.isArray(errors)) {
    return errors;
  }
  
  // If it's an object with categories, flatten it
  const flattenedErrors = [];
  Object.entries(errors).forEach(([category, categoryErrors]) => {
    if (Array.isArray(categoryErrors)) {
      flattenedErrors.push(...categoryErrors);
    }
  });
  return flattenedErrors;
};

const DEBUG = true;

// Fallback storage handler with better error handling
const handleStorageFallback = (key, data) => {
  try {
    const existingData = JSON.parse(localStorage.getItem(key) || '[]');
    const updatedData = Array.isArray(existingData) ? [...existingData, data] : [data];
    localStorage.setItem(key, JSON.stringify(updatedData));
    console.log(`Data saved to localStorage: ${key}`);
    return data;
  } catch (error) {
    console.error(`Failed to save to localStorage: ${key}`, error);
    return null;
  }
};

// Helper function to get error counts by category
export const getErrorsByCategory = (errors) => {
  const normalizedErrors = normalizeErrors(errors);
  const counts = {};
  normalizedErrors.forEach(error => {
    counts[error.category] = (counts[error.category] || 0) + 1;
  });
  return counts;
};

// Helper function to calculate total errors
export const getTotalErrors = (errors) => {
  const normalizedErrors = normalizeErrors(errors);
  return normalizedErrors.length;
};

// First transform the error array into category counts
const transformErrorsToCategories = (errors) => {
  const categoryCount = {};
  errors.forEach(error => {
    categoryCount[error.category] = (categoryCount[error.category] || 0) + 1;
  });
  return categoryCount;
};

// Helper functions remain the same
export const calculateErrorTrends = (stats) => {
  if (!Array.isArray(stats) || stats.length < 2) return 0;
  
  const firstFive = stats.slice(0, Math.min(5, Math.floor(stats.length / 2)));
  const lastFive = stats.slice(-Math.min(5, Math.floor(stats.length / 2)));
  
  const earlyAvg = firstFive.reduce((sum, stat) => sum + stat.totalErrors, 0) / firstFive.length;
  const recentAvg = lastFive.reduce((sum, stat) => sum + stat.totalErrors, 0) / lastFive.length;
  
  return earlyAvg === 0 ? 0 : Math.round(((earlyAvg - recentAvg) / earlyAvg) * 100);
};

export const findCommonErrors = (stats) => {
  if (!Array.isArray(stats)) return [];
  
  const errorCounts = {};
  stats.forEach(stat => {
    if (stat.errorsByCategory) {
      Object.entries(stat.errorsByCategory).forEach(([category, count]) => {
        errorCounts[category] = (errorCounts[category] || 0) + count;
      });
    }
  });
  
  return Object.entries(errorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([category, count]) => ({
      category: ERROR_CATEGORIES[category] || category,
      count
    }));
};

export const calculateSectionRates = (stats) => {
  if (!Array.isArray(stats)) return {};
  
  const sectionStats = {};
  stats.forEach(stat => {
    if (!sectionStats[stat.sectionType]) {
      sectionStats[stat.sectionType] = { total: 0, complete: 0 };
    }
    sectionStats[stat.sectionType].total++;
    if (stat.isComplete) {
      sectionStats[stat.sectionType].complete++;
    }
  });
  
  return Object.entries(sectionStats).reduce((acc, [type, data]) => {
    acc[type] = Math.round((data.complete / data.total) * 100);
    return acc;
  }, {});
};

export const findCommonMissingRequirements = (stats) => {
  if (!Array.isArray(stats)) return [];
  
  const requirements = {};
  stats.forEach(stat => {
    if (stat.details?.completionStatus?.missing) {
      stat.details.completionStatus.missing.forEach(req => {
        requirements[req] = (requirements[req] || 0) + 1;
      });
    }
  });
  
  return Object.entries(requirements)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([requirement, count]) => ({
      requirement,
      frequency: Math.round((count / stats.length) * 100)
    }));
};

