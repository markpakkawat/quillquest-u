// utils/errorTracking.js
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

const ENDPOINTS = {
  base: '/users/statistics',
  errors: '/users/statistics/errors',
  completeness: '/users/statistics/completeness',
  userStats: '/users/statistics/monthly',
  analysis: {
    conclusion: '/users/statistics/analysis/conclusion',
    body: (timestamp) => `/users/statistics/analysis/body-${timestamp}`,
    section: (id) => `/users/statistics/analysis/${id}`
  }
};

// Storage helper functions
const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error retrieving from localStorage: ${key}`, error);
      return defaultValue;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error saving to localStorage: ${key}`, error);
      return false;
    }
  }
};

// Default writing style
const getDefaultWritingStyle = () => ({
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
});

// Writing analysis functions
export const saveWritingAnalysis = async (sectionId, analysisData) => {
  try {
    try {
      const response = await api.post(`${ENDPOINTS.writingAnalysis}/${sectionId}`, analysisData);
      return response.data;
    } catch (apiError) {
      console.warn('Failed to save writing analysis to API, falling back to localStorage');
      localStorage.setItem(`writingAnalysis_${sectionId}`, JSON.stringify(analysisData));
      return analysisData;
    }
  } catch (error) {
    console.error('Error saving writing analysis:', error);
    throw error;
  }
};

export const getWritingAnalysis = async (sectionId) => {
  try {
    let endpoint;
    if (sectionId === 'conclusion') {
      endpoint = '/users/statistics/analysis/conclusion';
    } else if (sectionId.startsWith('body-')) {
      endpoint = `/users/statistics/analysis/${sectionId}`;
    } else {
      endpoint = `/users/statistics/analysis/${sectionId}`;
    }

    try {
      // Add debugging log
      console.log('Making API request to:', endpoint);
      
      const response = await api.get(endpoint);
      return response.data;
    } catch (apiError) {
      console.warn('Writing analysis API error:', {
        endpoint,
        error: apiError.message,
        status: apiError.response?.status,
        data: apiError.response?.data
      });

      // Fallback to localStorage
      console.log('Falling back to localStorage');
      const data = localStorage.getItem(`writingAnalysis_${sectionId}`);
      if (data) {
        try {
          return JSON.parse(data);
        } catch (parseError) {
          console.error('Error parsing localStorage data:', parseError);
        }
      }

      console.log('Using default writing style');
      return getDefaultWritingStyle();
    }
  } catch (error) {
    console.error('Error in getWritingAnalysis:', error);
    return getDefaultWritingStyle();
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

// Helper functions
export const normalizeErrors = (errors) => {
  if (Array.isArray(errors)) return errors;
  
  const flattenedErrors = [];
  Object.entries(errors).forEach(([category, categoryErrors]) => {
    if (Array.isArray(categoryErrors)) {
      flattenedErrors.push(...categoryErrors);
    }
  });
  return flattenedErrors;
};

export const getErrorsByCategory = (errors) => {
  const normalizedErrors = normalizeErrors(errors);
  const counts = {};
  normalizedErrors.forEach(error => {
    counts[error.category] = (counts[error.category] || 0) + 1;
  });
  return counts;
};

export const getTotalErrors = (errors) => {
  const normalizedErrors = normalizeErrors(errors);
  return normalizedErrors.length;
};

// Sync functions
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

export default {
  getWritingAnalysis,
  saveWritingAnalysis,
  saveErrorStats,
  getErrorsByCategory,
  getTotalErrors,
  syncAllPendingStats,
  getErrorStats,
  getCompletenessStats,
  saveCompletenessStats,
  ERROR_CATEGORIES,
  SECTION_TYPES
};